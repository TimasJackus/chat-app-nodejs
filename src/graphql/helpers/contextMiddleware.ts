interface ContextHeaders extends Headers {
    authorization: string
}

interface ContextRequest extends Request {
    headers: ContextHeaders
}

interface Connection {
    context: object
}

export const contextMiddleware = ({
    req,
    connection,
}: {
    req: ContextRequest
    connection: Connection
}) => {
    if (connection) {
        return connection.context
    }
    return {
        authorization: req.headers.authorization,
        requestId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
    }
}
