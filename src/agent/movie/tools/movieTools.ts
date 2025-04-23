import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MovieRecommendationService } from "./neo4j";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../../agent-uis/index";

// Initialize the service
const movieService = new MovieRecommendationService();

// Tool to search movies by title
const searchMoviesByTitle = tool(
  async (input, config) => {
    const movies = await movieService.searchMoviesByTitle(
      input.title,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "search_movies_by_title",
    description: "Search for movies by title (full or partial match)",
    schema: z.object({
      title: z.string().describe("Movie title to search for"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get movie by exact title
const getMovieByExactTitle = tool(
  async (input, config) => {
    const movie = await movieService.getMovieByExactTitle(input.title);
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movie) {
    //   ui.push({
    //     name: "movie-detail-3d",
    //     props: { movie },
    //   });
    // }
    return movie ? JSON.stringify(movie) : "Movie not found";
  },
  {
    name: "get_movie_by_exact_title",
    description: "Get movie details by exact title",
    schema: z.object({
      title: z.string().describe("Exact movie title"),
    }),
  },
);

// Tool to get movie by ID
const getMovieById = tool(
  async (input, config) => {
    const movie = await movieService.getMovieById(input.id);
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movie) {
    //   ui.push({
    //     name: "movie-detail-3d",
    //     props: { movie },
    //   });
    // }
    return movie ? JSON.stringify(movie) : "Movie not found";
  },
  {
    name: "get_movie_by_id",
    description: "Get movie details by ID",
    schema: z.object({
      id: z.number().describe("Movie ID"),
    }),
  },
);

// Tool to recommend movies by genre
const recommendByGenre = tool(
  async (input, config) => {
    const movies = await movieService.recommendByGenre(
      input.genre,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "recommend_by_genre",
    description: "Recommend movies by genre",
    schema: z.object({
      genre: z.string().describe("Genre name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to list all genres
const listAllGenres = tool(
  async () => {
    const genres = await movieService.listAllGenres();
    return JSON.stringify(genres);
  },
  {
    name: "list_all_genres",
    description: "Get a list of all available movie genres",
    schema: z.object({
      noOp: z.string().optional().describe("No-op parameter"),
    }),
  },
);

// Tool to recommend movies by actor
const recommendByActor = tool(
  async (input, config) => {
    const movies = await movieService.recommendByActor(
      input.actorName,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "recommend_by_actor",
    description: "Recommend movies by actor",
    schema: z.object({
      actorName: z.string().describe("Actor name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to search actors
const searchActors = tool(
  async (input) => {
    const actors = await movieService.searchActors(input.name, input.limit);
    return JSON.stringify(actors);
  },
  {
    name: "search_actors",
    description: "Search for actors with partial name match",
    schema: z.object({
      name: z.string().describe("Partial actor name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of actors to return"),
    }),
  },
);

// Tool to get movie cast
const getMovieCast = tool(
  async (input) => {
    const cast = await movieService.getMovieCast(input.movieTitle);
    return JSON.stringify(cast);
  },
  {
    name: "get_movie_cast",
    description: "Get actors for a specific movie",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
    }),
  },
);

// Tool to find similar movies
const findSimilarMovies = tool(
  async (input, config) => {
    const movies = await movieService.findSimilarMovies(
      input.movieTitle,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_similar_movies",
    description: "Find similar movies based on shared genres",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to find similar movies by ID
const findSimilarMoviesById = tool(
  async (input, config) => {
    const movies = await movieService.findSimilarMoviesById(
      input.movieId,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_similar_movies_by_id",
    description: "Find similar movies based on movie ID",
    schema: z.object({
      movieId: z.number().describe("Movie ID"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to recommend movies by language
const recommendByLanguage = tool(
  async (input, config) => {
    const movies = await movieService.recommendByLanguage(
      input.language,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "recommend_by_language",
    description: "Recommend movies by language",
    schema: z.object({
      language: z.string().describe('Language code (e.g., "en" for English)'),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get available languages
const getAvailableLanguages = tool(
  async () => {
    const languages = await movieService.getAvailableLanguages();
    return JSON.stringify(languages);
  },
  {
    name: "get_available_languages",
    description: "Get list of available movie languages",
    schema: z.object({
      noOp: z.string().optional().describe("No-op parameter"),
    }),
  },
);

// Tool to recommend movies by writer
const recommendByWriter = tool(
  async (input, config) => {
    const movies = await movieService.recommendByWriter(
      input.writerName,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "recommend_by_writer",
    description: "Recommend movies by writer",
    schema: z.object({
      writerName: z.string().describe("Writer name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to search writers
const searchWriters = tool(
  async (input) => {
    const writers = await movieService.searchWriters(input.name, input.limit);
    return JSON.stringify(writers);
  },
  {
    name: "search_writers",
    description: "Search for writers with partial name match",
    schema: z.object({
      name: z.string().describe("Partial writer name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of writers to return"),
    }),
  },
);

// Tool to get movie writers
const getMovieWriters = tool(
  async (input) => {
    const writers = await movieService.getMovieWriters(input.movieTitle);
    return JSON.stringify(writers);
  },
  {
    name: "get_movie_writers",
    description: "Get writers for a specific movie",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
    }),
  },
);

// Tool to recommend movies by director
const recommendByDirector = tool(
  async (input, config) => {
    const movies = await movieService.recommendByDirector(
      input.directorName,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "recommend_by_director",
    description: "Recommend movies by director",
    schema: z.object({
      directorName: z.string().describe("Director name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to search directors
const searchDirectors = tool(
  async (input) => {
    const directors = await movieService.searchDirectors(
      input.name,
      input.limit,
    );
    return JSON.stringify(directors);
  },
  {
    name: "search_directors",
    description: "Search for directors with partial name match",
    schema: z.object({
      name: z.string().describe("Partial director name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of directors to return"),
    }),
  },
);

// Tool to get movie directors
const getMovieDirectors = tool(
  async (input) => {
    const directors = await movieService.getMovieDirectors(input.movieTitle);
    return JSON.stringify(directors);
  },
  {
    name: "get_movie_directors",
    description: "Get directors for a specific movie",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
    }),
  },
);

// Tool to find movies by production company
const findMoviesByCompany = tool(
  async (input, config) => {
    const movies = await movieService.findMoviesByCompany(
      input.companyName,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_movies_by_company",
    description: "Find movies by production company",
    schema: z.object({
      companyName: z.string().describe("Production company name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get highly rated movies
const getHighlyRatedMovies = tool(
  async (input, config) => {
    const movies = await movieService.getHighlyRatedMovies(
      input.minRating,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "get_highly_rated_movies",
    description: "Get movies with high ratings",
    schema: z.object({
      minRating: z
        .number()
        .default(8.0)
        .describe("Minimum vote average rating"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get recent movies
const getRecentMovies = tool(
  async (input, config) => {
    const movies = await movieService.getRecentMovies(
      input.yearsBack,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "get_recent_movies",
    description: "Get recently released movies",
    schema: z.object({
      yearsBack: z
        .number()
        .default(1)
        .describe("Number of years back from current year"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get movies by year
const getMoviesByYear = tool(
  async (input, config) => {
    const movies = await movieService.getMoviesByYear(input.year, input.limit);
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "get_movies_by_year",
    description: "Get movies released in a specific year",
    schema: z.object({
      year: z.string().describe("Release year"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get movies by PG rating
const getMoviesByPgRating = tool(
  async (input, config) => {
    const movies = await movieService.getMoviesByPgRating(
      input.rating,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "get_movies_by_pg_rating",
    description: "Get movies with specific PG rating",
    schema: z.object({
      rating: z.string().describe('PG rating (e.g., "PG-13", "R")'),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get available PG ratings
const getAvailablePgRatings = tool(
  async () => {
    const ratings = await movieService.getAvailablePgRatings();
    return JSON.stringify(ratings);
  },
  {
    name: "get_available_pg_ratings",
    description: "Get all available PG ratings in the database",
    schema: z.object({
      noOp: z.string().optional().describe("No-op parameter"),
    }),
  },
);

// Tool to find movies by actor and director
const findMoviesByActorAndDirector = tool(
  async (input, config) => {
    const movies = await movieService.findMoviesByActorAndDirector(
      input.actorName,
      input.directorName,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_movies_by_actor_and_director",
    description:
      "Find movies where specific actor and director worked together",
    schema: z.object({
      actorName: z.string().describe("Actor name"),
      directorName: z.string().describe("Director name"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool for complex search with multiple criteria
const findMoviesWithCriteria = tool(
  async (input, config) => {
    const movies = await movieService.findMoviesWithCriteria({
      title: input.title,
      genre: input.genre,
      actor: input.actor,
      director: input.director,
      minRating: input.minRating,
      year: input.year,
      language: input.language,
      limit: input.limit,
    });
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_movies_with_criteria",
    description: "Find movies with multiple criteria (complex search)",
    schema: z.object({
      title: z.string().optional().describe("Movie title pattern"),
      genre: z.string().optional().describe("Genre name"),
      actor: z.string().optional().describe("Actor name"),
      director: z.string().optional().describe("Director name"),
      minRating: z.number().optional().describe("Minimum vote average rating"),
      year: z.string().optional().describe("Release year"),
      language: z.string().optional().describe("Original language code"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to find movies with shared actors
const findMoviesWithSharedActors = tool(
  async (input, config) => {
    const movies = await movieService.findMoviesWithSharedActors(
      input.movieTitle,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "find_movies_with_shared_actors",
    description: "Find movies that have common actors with a given movie",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get movies with similar themes
const getMoviesWithSimilarThemes = tool(
  async (input, config) => {
    const movies = await movieService.getMoviesWithSimilarThemes(
      input.movieTitle,
      input.limit,
    );
    const ui = typedUi<typeof ComponentMap>(config);
    // if (movies.length > 0) {
    //   console.log(config.toolCall.id);
    //   const response = {
    //     id: config.toolCall.id,
    //     type: "ai",
    //     content: "",
    //   };
    //   ui.push(
    //     {
    //       name: "movie-carousel",
    //       props: { movies },
    //     },
    //     {
    //       message: response,
    //     },
    //   );
    // }
    return JSON.stringify(movies);
  },
  {
    name: "get_movies_with_similar_themes",
    description:
      "Get movies with similar themes (using connections between genres, directors and writers)",
    schema: z.object({
      movieTitle: z.string().describe("Movie title"),
      limit: z
        .number()
        .default(10)
        .describe("Maximum number of movies to return"),
    }),
  },
);

// Tool to get Neo4j schema

const getNeo4jSchema = tool(
  async () => {
    const schema = `Node properties:
                    Movie {id: INTEGER, overview: STRING, original_language: STRING, original_title: STRING, runtime: INTEGER, title: STRING, revenue: INTEGER, release_date: STRING, popularity: FLOAT, vote_average: FLOAT, vote_count: INTEGER, budget: INTEGER, year: STRING, description: STRING, poster_url: STRING, pg_rating: STRING, imdb_url: STRING}
                    Actor {name: STRING}
                    Director {name: STRING}
                    Genre {name: STRING}
                    Company {id: INTEGER, name: STRING}
                    Writer {name: STRING}
                    Relationship properties:
                    WROTE {role: STRING}
                    ACTED_IN {role: STRING}
                    The relationships:
                    (:Movie)-[:BELONGS_TO_GENRE]->(:Genre)
                    (:Movie)-[:PRODUCED_BY]->(:Company)
                    (:Actor)-[:ACTED_IN]->(:Movie)
                    (:Director)-[:DIRECTED]->(:Movie)
                    (:Writer)-[:WROTE]->(:Movie)
                    `;
    return schema;
  },
  {
    name: "get_neo4j_schema",
    description:
      "Get Neo4j schema for query generation against the movie database",
    schema: z.object({
      noOp: z.string().optional().describe("No-op parameter"),
    }),
  },
);

// Tool to execute a cypher query
const executeCypherQuery = tool(
  async (input) => {
    const movieService = new MovieRecommendationService();
    const records = await movieService.executeCypherQuery(input.query);
    return JSON.stringify(records);
  },
  {
    name: "execute_cypher_query",
    description:
      "Execute a cypher query against the movie database for exploration",
    schema: z.object({
      query: z.string().describe("Cypher query to execute"),
    }),
  },
);

// Create an array of all tools
const movieTools = [
  searchMoviesByTitle,
  getMovieByExactTitle,
  getMovieById,
  recommendByGenre,
  listAllGenres,
  recommendByActor,
  searchActors,
  getMovieCast,
  findSimilarMovies,
  findSimilarMoviesById,
  recommendByLanguage,
  getAvailableLanguages,
  recommendByWriter,
  searchWriters,
  getMovieWriters,
  recommendByDirector,
  searchDirectors,
  getMovieDirectors,
  findMoviesByCompany,
  getHighlyRatedMovies,
  getRecentMovies,
  getMoviesByYear,
  getMoviesByPgRating,
  getAvailablePgRatings,
  findMoviesByActorAndDirector,
  findMoviesWithCriteria,
  findMoviesWithSharedActors,
  getMoviesWithSimilarThemes,
  getNeo4jSchema,
  executeCypherQuery,
];

// Create the ToolNode
const movieToolNode = new ToolNode(movieTools);

// Helper function to clean up resources when done
async function closeMovieService() {
  await movieService.close();
}

export {
  movieToolNode,
  movieTools,
  closeMovieService,
  // Individual tools for direct access if needed
  searchMoviesByTitle,
  getMovieByExactTitle,
  getMovieById,
  recommendByGenre,
  listAllGenres,
  recommendByActor,
  searchActors,
  getMovieCast,
  findSimilarMovies,
  findSimilarMoviesById,
  recommendByLanguage,
  getAvailableLanguages,
  recommendByWriter,
  searchWriters,
  getMovieWriters,
  recommendByDirector,
  searchDirectors,
  getMovieDirectors,
  findMoviesByCompany,
  getHighlyRatedMovies,
  getRecentMovies,
  getMoviesByYear,
  getMoviesByPgRating,
  getAvailablePgRatings,
  findMoviesByActorAndDirector,
  findMoviesWithCriteria,
  findMoviesWithSharedActors,
  getMoviesWithSimilarThemes,
  getNeo4jSchema,
  executeCypherQuery,
};
