import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ActivitySchema } from "./activity-schema";
import { config } from "./config";
import { getDatabaseClient } from "./db";

export const logActivity = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const parsedJson = JSON.parse(event.body || "{}");

    const validationRes = ActivitySchema.safeParse(parsedJson);

    if (!validationRes.success) {
      console.log("Validation Error", parsedJson, validationRes.error.issues);

      return {
        statusCode: 400,
        body: JSON.stringify({
          msg: "Invalid request body",
          error: validationRes.error.flatten().fieldErrors,
        }),
      };
    }

    const reqBody = validationRes.data;

    const secretHeader = event.headers["x-secret"];
    if (secretHeader !== config.secret) {
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
        name: reqBody.name,
      },
      select: {
        id: true,
        timestamp: true,
      },
    });

    const newActivity = await dbClient.activity.create({
      data: {
        name: reqBody.name,
        count: reqBody.count,
        timestamp: reqBody.timestamp || new Date().toISOString(),
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
  } catch (unhandledException) {
    console.error("Unhandled Exception", unhandledException);
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: "Something went wrong!" }),
    };
  }
};
