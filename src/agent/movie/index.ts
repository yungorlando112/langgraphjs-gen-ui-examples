import { movieToolNode, movieTools } from "./tools/movieTools";
import {
  typedUi,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui/server";

import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
  END,
  START,
} from "@langchain/langgraph";

import { ChatOpenAI } from "@langchain/openai";

const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  ui: Annotation({ reducer: uiMessageReducer, default: () => [] }),
});

const modelWithTools = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
}).bindTools(movieTools);

const propmt = `
          You are an AI Movie expert who helps users find movies and recommend based on their preferences.
          Use the tools provided to you to help answer the user's question.
          Only use the tools provided. Do not Answer using your pretrained knowledge.
          For more general questions that cant be answerd specifically by tools provided, use the queryExecution tool along with the schema too to write cypher queries to exxecute against the Neo4j database.
          Do not write queries that will update or write to the Neo4j database. For Science Fiction genre Search as Science-Fiction with the hyphen.
        `;

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;

  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
};

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;
  const systemMessage = {
    role: "system",
    content: propmt,
  };
  const response = await modelWithTools.invoke([systemMessage, ...messages]);
  return { messages: response };
};

const workflow = new StateGraph(AgentState)
  // Define the two nodes we will cycle between
  .addNode("agent", callModel)
  .addNode("tools", movieToolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END])
  .addEdge("tools", "agent");

export const agent = workflow.compile();

agent.name = "Movie Recommendation Agent";
