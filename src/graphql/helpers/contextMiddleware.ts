import { Context } from "../types";

interface ContextHeaders extends Headers {
  authorization: string;
  host: string;
}

interface ContextRequest extends Request {
  protocol: "http" | "https" | "ws";
  headers: ContextHeaders;
}

interface Connection {
  context: Context;
}

export const contextMiddleware = ({
  req,
  connection,
}: {
  req: ContextRequest;
  connection: Connection;
}) => {
  if (connection) {
    return connection.context;
  }
  const hostname = `${req.protocol}://${req.headers.host}`;
  return {
    hostname,
    authorization: req.headers.authorization,
    requestId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
  };
};
