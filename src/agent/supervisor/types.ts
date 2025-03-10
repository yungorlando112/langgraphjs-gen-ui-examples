import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";

export const SupervisorAnnotation = Annotation.Root({
  ...GenerativeUIAnnotation.spec,
});

export type SupervisorState = typeof SupervisorAnnotation.State;
export type SupervisorUpdate = typeof SupervisorAnnotation.Update;
