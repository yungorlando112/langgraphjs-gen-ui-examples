import neo4j from "neo4j-driver";
import type { Driver, Session, Record as Neo4jRecord } from "neo4j-driver";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
// Define schemas for validation and typing
const MovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().nullable(),
  original_language: z.string().nullable(),
  original_title: z.string().nullable(),
  runtime: z.number().nullable(),
  revenue: z.number().nullable(),
  release_date: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  vote_count: z.number().nullable(),
  budget: z.number().nullable(),
  year: z.string().nullable(),
  description: z.string().nullable(),
  poster_url: z.string().nullable(),
  pg_rating: z.string().nullable(),
  imdb_url: z.string().nullable(),
});

const ActorSchema = z.object({
  name: z.string(),
});

const DirectorSchema = z.object({
  name: z.string(),
});

const GenreSchema = z.object({
  name: z.string(),
});

const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const WriterSchema = z.object({
  name: z.string(),
});

// Define types based on schemas
type Movie = z.infer<typeof MovieSchema>;
type Actor = z.infer<typeof ActorSchema>;
type Director = z.infer<typeof DirectorSchema>;
type Genre = z.infer<typeof GenreSchema>;
type Company = z.infer<typeof CompanySchema>;
type Writer = z.infer<typeof WriterSchema>;

/**
 * DatabaseClient - Manages Neo4j database connection and provides query methods
 */
class DatabaseClient {
  private driver: Driver;

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  /**
   * Creates a new session for each query operation
   */
  private getSession(): Session {
    return this.driver.session();
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Process parameters to ensure all numeric values used for LIMIT are integers
   */
  private processQueryParams(params: Record<string, any>): Record<string, any> {
    const processedParams = { ...params };

    // Common parameter names that might be used for LIMIT clauses
    const limitParamNames = [
      "limit",
      "topN",
      "maxResults",
      "count",
      "numResults",
    ];

    for (const key of Object.keys(processedParams)) {
      // Check if this is a parameter that likely will be used for LIMIT
      if (
        limitParamNames.includes(key) ||
        key.toLowerCase().includes("limit")
      ) {
        const value = processedParams[key];
        if (typeof value === "number") {
          // Convert to integer using Math.floor
          processedParams[key] = Math.floor(value);
        }
      }
    }

    return processedParams;
  }

  async executeQuery(
    query: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    const session = this.getSession();
    try {
      // Process parameters to ensure integer values for LIMIT parameters
      const processedParams = this.processQueryParams(params);

      const result = await session.run(query, processedParams);
      return result.records;
    } catch (error) {
      console.error("Query execution failed:", error);
      throw error;
    } finally {
      // Always close the session to release resources and avoid session leaks
      await session.close();
    }
  }
}

/**
 * Movie Recommendation Service - Contains all recommendation tools
 */
export class MovieRecommendationService {
  private dbClient: DatabaseClient;

  constructor() {
    this.dbClient = new DatabaseClient(
      process.env.NEO4J_URI as string,
      process.env.NEO4J_USERNAME as string,
      process.env.NEO4J_PASSWORD as string,
    )
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.dbClient.close();
  }

  /**
   * Converts Neo4j records to typed objects
   */
  private processMovieResults(records: Neo4jRecord[]): Movie[] {
    return records.map((record: any) => {
      const movieNode = record.get("movie");
      const movieData = movieNode.properties;

      // Transform Neo4j integers to JavaScript numbers
      return MovieSchema.parse({
        ...movieData,
        id: movieData.id.toNumber ? movieData.id.toNumber() : movieData.id,
        runtime:
          movieData.runtime && movieData.runtime.toNumber
            ? movieData.runtime.toNumber()
            : movieData.runtime,
        revenue:
          movieData.revenue && movieData.revenue.toNumber
            ? movieData.revenue.toNumber()
            : movieData.revenue,
        popularity:
          movieData.popularity && movieData.popularity.toNumber
            ? movieData.popularity.toNumber()
            : movieData.popularity,
        vote_average:
          movieData.vote_average && movieData.vote_average.toNumber
            ? movieData.vote_average.toNumber()
            : movieData.vote_average,
        vote_count:
          movieData.vote_count && movieData.vote_count.toNumber
            ? movieData.vote_count.toNumber()
            : movieData.vote_count,
        budget:
          movieData.budget && movieData.budget.toNumber
            ? movieData.budget.toNumber()
            : movieData.budget,
      });
    });
  }

  /**
   *  Do cypher query
   */

  async executeCypherQuery(query: string): Promise<any> {
    try {
      const records = await this.dbClient.executeQuery(query);
      return records.map((record: any) => {
        // Convert record to a plain JS object
        const result: Record<string, any> = {};
        record.keys.forEach((key: any) => {
          const value = record.get(key);
          // Handle Neo4j nodes
          if (value && typeof value === "object" && value.properties) {
            result[key] = { ...value.properties };
            // Convert Neo4j integers to JS numbers
            Object.keys(result[key]).forEach((prop) => {
              if (
                result[key][prop] &&
                typeof result[key][prop].toNumber === "function"
              ) {
                result[key][prop] = result[key][prop].toNumber();
              }
            });
          } else {
            // Handle primitive values
            result[key] = value;
          }
        });
        return result;
      });
    } catch (error) {
      console.error("Cypher query execution failed:", error);
      throw error;
    }
  }

  /**
   * Search for movies by title (full or partial match)
   */
  async searchMoviesByTitle(
    title: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.original_title =~ $titlePattern
      RETURN movie
      ORDER BY movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      titlePattern: `(?i).*${title}.*`,
      limit: limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get movie details by exact title
   */
  async getMovieByExactTitle(title: string): Promise<Movie | null> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.original_title = $title
      RETURN movie
    `;

    const records = await this.dbClient.executeQuery(query, { title });

    if (records.length === 0) {
      return null;
    }

    return this.processMovieResults(records)[0];
  }

  /**
   * Get movie by ID
   */
  async getMovieById(id: number): Promise<Movie | null> {
    const query = `
      MATCH (movie:Movie {id: $id})
      RETURN movie
    `;

    const records = await this.dbClient.executeQuery(query, { id });

    if (records.length === 0) {
      return null;
    }

    return this.processMovieResults(records)[0];
  }

  /**
   * Recommend movies by genre
   */
  async recommendByGenre(genre: string, limit: number = 10): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)-[:BELONGS_TO_GENRE]->(genre:Genre)
      WHERE genre.name =~ $genrePattern
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      genrePattern: `(?i).*${genre}.*`,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get a list of all genres
   */
  async listAllGenres(): Promise<Genre[]> {
    const query = `
      MATCH (genre:Genre)
      RETURN genre
      ORDER BY genre.name
    `;

    const records = await this.dbClient.executeQuery(query);

    return records.map((record: any) => {
      const genreNode = record.get("genre");
      return GenreSchema.parse(genreNode.properties);
    });
  }

  /**
   * Recommend movies by actor
   */
  async recommendByActor(
    actorName: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (actor:Actor {name: $actorName})-[:ACTED_IN]->(movie:Movie)
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      actorName,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Search for actors with partial name match
   */
  async searchActors(name: string, limit: number = 10): Promise<Actor[]> {
    const query = `
      MATCH (actor:Actor)
      WHERE actor.name =~ $namePattern
      RETURN actor
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      namePattern: `(?i).*${name}.*`,
      limit,
    });

    return records.map((record: any) => {
      const actorNode = record.get("actor");
      return ActorSchema.parse(actorNode.properties);
    });
  }

  /**
   * Get actors for a specific movie
   */
  async getMovieCast(
    movieTitle: string,
  ): Promise<{ actor: Actor; role: string | null }[]> {
    const query = `
      MATCH (actor:Actor)-[r:ACTED_IN]->(movie:Movie)
      WHERE movie.original_title = $movieTitle
      RETURN actor, r.role as role
    `;

    const records = await this.dbClient.executeQuery(query, { movieTitle });

    return records.map((record: any) => {
      const actorNode = record.get("actor");
      const role = record.get("role");
      return {
        actor: ActorSchema.parse(actorNode.properties),
        role: role,
      };
    });
  }

  /**
   * Find similar movies based on shared genres
   */
  async findSimilarMovies(
    movieTitle: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie {original_title: $movieTitle})-[:BELONGS_TO_GENRE]->(genre:Genre)<-[:BELONGS_TO_GENRE]-(similar:Movie)
      WHERE movie <> similar
      RETURN similar as movie, count(genre) as genreOverlap
      ORDER BY genreOverlap DESC, similar.vote_average DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      movieTitle,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Find similar movies based on movie ID
   */
  async findSimilarMoviesById(
    movieId: number,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie {id: $movieId})-[:BELONGS_TO_GENRE]->(genre:Genre)<-[:BELONGS_TO_GENRE]-(similar:Movie)
      WHERE movie <> similar
      RETURN similar as movie, count(genre) as genreOverlap
      ORDER BY genreOverlap DESC, similar.vote_average DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      movieId,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Recommend movies by language
   */
  async recommendByLanguage(
    language: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.original_language = $language
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      language,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get available languages
   */
  async getAvailableLanguages(): Promise<string[]> {
    const query = `
      MATCH (movie:Movie)
      RETURN DISTINCT movie.original_language as language
      ORDER BY language
    `;

    const records = await this.dbClient.executeQuery(query);

    return records
      .map((record: any) => record.get("language"))
      .filter((lang: any) => lang !== null && lang !== "");
  }

  /**
   * Recommend movies by writer
   */
  async recommendByWriter(
    writerName: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (writer:Writer {name: $writerName})-[:WROTE]->(movie:Movie)
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      writerName,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Search for writers
   */
  async searchWriters(name: string, limit: number = 10): Promise<Writer[]> {
    const query = `
      MATCH (writer:Writer)
      WHERE writer.name =~ $namePattern
      RETURN writer
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      namePattern: `(?i).*${name}.*`,
      limit,
    });

    return records.map((record: any) => {
      const writerNode = record.get("writer");
      return WriterSchema.parse(writerNode.properties);
    });
  }

  /**
   * Get writers for a specific movie
   */
  async getMovieWriters(
    movieTitle: string,
  ): Promise<{ writer: Writer; role: string | null }[]> {
    const query = `
      MATCH (writer:Writer)-[r:WROTE]->(movie:Movie)
      WHERE movie.original_title = $movieTitle
      RETURN writer, r.role as role
    `;

    const records = await this.dbClient.executeQuery(query, { movieTitle });

    return records.map((record: any) => {
      const writerNode = record.get("writer");
      const role = record.get("role");
      return {
        writer: WriterSchema.parse(writerNode.properties),
        role: role,
      };
    });
  }

  /**
   * Recommend movies by director
   */
  async recommendByDirector(
    directorName: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (director:Director {name: $directorName})-[:DIRECTED]->(movie:Movie)
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      directorName,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Search for directors
   */
  async searchDirectors(name: string, limit: number = 10): Promise<Director[]> {
    const query = `
      MATCH (director:Director)
      WHERE director.name =~ $namePattern
      RETURN director
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      namePattern: `(?i).*${name}.*`,
      limit,
    });

    return records.map((record: any) => {
      const directorNode = record.get("director");
      return DirectorSchema.parse(directorNode.properties);
    });
  }

  /**
   * Get directors for a specific movie
   */
  async getMovieDirectors(movieTitle: string): Promise<Director[]> {
    const query = `
      MATCH (director:Director)-[:DIRECTED]->(movie:Movie)
      WHERE movie.original_title = $movieTitle
      RETURN director
    `;

    const records = await this.dbClient.executeQuery(query, { movieTitle });

    return records.map((record: any) => {
      const directorNode = record.get("director");
      return DirectorSchema.parse(directorNode.properties);
    });
  }

  /**
   * Find movies by production company
   */
  async findMoviesByCompany(
    companyName: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)-[:PRODUCED_BY]->(company:Company)
      WHERE company.name =~ $companyPattern
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      companyPattern: `(?i).*${companyName}.*`,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get movies with high ratings (vote_average >= minRating)
   */
  async getHighlyRatedMovies(
    minRating: number = 8.0,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.vote_average >= $minRating
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      minRating,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get recently released movies (within the past N years)
   */
  //TODO: Research
  async getRecentMovies(
    yearsBack: number = 1,
    limit: number = 10,
  ): Promise<Movie[]> {
    const currentYear = new Date().getFullYear();
    const earliestYear = (currentYear - yearsBack).toString();

    const query = `
      MATCH (movie:Movie)
      WHERE movie.release_date STARTS WITH >= $earliestYear
      RETURN movie
      ORDER BY movie.release_date DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      earliestYear,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get movies released in a specific year
   */
  async getMoviesByYear(year: string, limit: number = 10): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.release_date STARTS WITH = $year
      RETURN movie
      ORDER BY movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      year,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get movies with specific PG rating
   */
  async getMoviesByPgRating(
    rating: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.pg_rating = $rating
      RETURN movie
      ORDER BY movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      rating,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get all available PG ratings
   */
  async getAvailablePgRatings(): Promise<string[]> {
    const query = `
      MATCH (movie:Movie)
      WHERE movie.pg_rating IS NOT NULL
      RETURN DISTINCT movie.pg_rating as rating
      ORDER BY rating
    `;

    const records = await this.dbClient.executeQuery(query);

    return records
      .map((record: any) => record.get("rating"))
      .filter((rating: any) => rating !== null && rating !== "");
  }

  /**
   * Find movies where actor and director worked together
   */
  async findMoviesByActorAndDirector(
    actorName: string,
    directorName: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (actor:Actor {name: $actorName})-[:ACTED_IN]->(movie:Movie)<-[:DIRECTED]-(director:Director {name: $directorName})
      RETURN movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      actorName,
      directorName,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * General purpose Cypher query executor (for advanced queries)
   * Use with caution as this allows arbitrary Cypher execution
   */
  async executeCustomCypherQuery(
    cypherQuery: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    try {
      const records = await this.dbClient.executeQuery(cypherQuery, params);
      return records.map((record: any) => {
        // Convert record to a plain JS object
        const result: Record<string, any> = {};
        record.keys.forEach((key: any) => {
          const value = record.get(key);
          // Handle Neo4j nodes
          if (value && typeof value === "object" && value.properties) {
            result[key] = { ...value.properties };
            // Convert Neo4j integers to JS numbers
            Object.keys(result[key]).forEach((prop) => {
              if (
                result[key][prop] &&
                typeof result[key][prop].toNumber === "function"
              ) {
                result[key][prop] = result[key][prop].toNumber();
              }
            });
          } else {
            // Handle primitive values
            result[key] = value;
          }
        });
        return result;
      });
    } catch (error) {
      console.error("Custom query execution failed:", error);
      throw error;
    }
  }

  /**
   * Find movies with multiple criteria (complex search)
   */
  async findMoviesWithCriteria({
    title = "",
    genre = "",
    actor = "",
    director = "",
    minRating = 0,
    year = "",
    language = "",
    limit = 10,
  }: {
    title?: string;
    genre?: string;
    actor?: string;
    director?: string;
    minRating?: number;
    year?: string;
    language?: string;
    limit?: number;
  }): Promise<Movie[]> {
    // Build query conditions based on provided criteria
    const conditions: string[] = [];
    const params: Record<string, any> = { limit };

    let actorMatch = "";
    let directorMatch = "";
    let genreMatch = "";

    if (title) {
      conditions.push("movie.title =~ $titlePattern");
      params.titlePattern = `(?i).*${title}.*`;
    }

    if (genre) {
      genreMatch =
        "MATCH (movie)-[:BELONGS_TO_GENRE]->(genre:Genre) WHERE genre.name =~ $genrePattern";
      params.genrePattern = `(?i).*${genre}.*`;
    }

    if (actor) {
      actorMatch =
        "MATCH (actor:Actor {name: $actorName})-[:ACTED_IN]->(movie)";
      params.actorName = actor;
    }

    if (director) {
      directorMatch =
        "MATCH (director:Director {name: $directorName})-[:DIRECTED]->(movie)";
      params.directorName = director;
    }

    if (minRating > 0) {
      conditions.push("movie.vote_average >= $minRating");
      params.minRating = minRating;
    }

    if (year) {
      conditions.push("movie.year = $year");
      params.year = year;
    }

    if (language) {
      conditions.push("movie.original_language = $language");
      params.language = language;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      MATCH (movie:Movie)
      ${genreMatch}
      ${actorMatch}
      ${directorMatch}
      ${whereClause}
      RETURN DISTINCT movie
      ORDER BY movie.vote_average DESC, movie.popularity DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, params);

    return this.processMovieResults(records);
  }

  /**
   * Find movies that have common actors with a given movie
   */
  async findMoviesWithSharedActors(
    movieTitle: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie {original_title: $movieTitle})<-[:ACTED_IN]-(actor:Actor)-[:ACTED_IN]->(otherMovie:Movie)
      WHERE movie <> otherMovie
      RETURN otherMovie as movie, count(DISTINCT actor) as actorCount
      ORDER BY actorCount DESC, otherMovie.vote_average DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      movieTitle,
      limit,
    });

    return this.processMovieResults(records);
  }

  /**
   * Get movies with similar themes (using connections between genres, directors and writers)
   */
  async getMoviesWithSimilarThemes(
    movieTitle: string,
    limit: number = 10,
  ): Promise<Movie[]> {
    const query = `
      MATCH (movie:Movie {original_title: $movieTitle})
      MATCH (movie)-[:BELONGS_TO_GENRE]->(genre:Genre)<-[:BELONGS_TO_GENRE]-(similar:Movie)
      WHERE movie <> similar
      WITH similar, count(DISTINCT genre) as genreScore
      
      OPTIONAL MATCH (movie)-[:DIRECTED]->(movie)<-[:DIRECTED]-(director:Director)-[:DIRECTED]->(similar)
      WITH similar, genreScore, count(DISTINCT director) as directorScore
      
      OPTIONAL MATCH (movie)<-[:WROTE]-(writer:Writer)-[:WROTE]->(similar)
      WITH similar, genreScore, directorScore, count(DISTINCT writer) as writerScore
      
      RETURN similar as movie, 
             (genreScore * 2) + (directorScore * 3) + (writerScore * 3) as similarityScore
      ORDER BY similarityScore DESC, similar.vote_average DESC
      LIMIT toInteger($limit)
    `;

    const records = await this.dbClient.executeQuery(query, {
      movieTitle,
      limit,
    });

    return this.processMovieResults(records);
  }
}

// Export types for usage
export type { Movie, Actor, Director, Genre, Company, Writer };
