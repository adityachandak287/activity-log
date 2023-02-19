import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { config } from "./config";
import { getDatabaseClient } from "./db";

type TRequestBody = { secret: string; count: number; activity: string };

export const logActivity = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || "{}") as TRequestBody;

  if (body.secret !== config.secret) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        msg: "Unauthorized!",
      }),
    };
  }

  const dbClient = await getDatabaseClient();

  const lastActivity = await dbClient.activity.findFirst({
    orderBy: {
      timestamp: "desc",
    },
    take: 1,
    where: {
      name: body.activity,
    },
    select: {
      id: true,
      timestamp: true,
    },
  });

  const newActivity = await dbClient.activity.create({
    data: {
      name: body.activity,
      count: body.count,
      timestamp: new Date().toISOString(),
    },
    select: {
      id: true,
      name: true,
      count: true,
      timestamp: true,
    },
  });

  const response = {
    created: {
      ...newActivity,
    },
    last: {
      ...lastActivity,
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
