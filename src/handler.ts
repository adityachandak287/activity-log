import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { formatDistance, subDays } from "date-fns";
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
    if (secretHeader !== config.SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          msg: "Unauthorized!",
        }),
      };
    }

    const dbClient = await getDatabaseClient();

    const newActivityTimestamp = new Date(reqBody.timestamp || Date.now());

    const [lastActivity, activityCount, newActivity] = await Promise.all([
      dbClient.activity.findFirst({
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
        where: {
          name: reqBody.name,
          timestamp: {
            lte: newActivityTimestamp,
          },
        },
        select: {
          id: true,
          timestamp: true,
        },
      }),
      dbClient.activity.count({
        where: {
          name: reqBody.name,
          timestamp: {
            gte: subDays(newActivityTimestamp, config.SUMMARY_WINDOW_DAYS),
            lte: newActivityTimestamp,
          },
        },
      }),
      dbClient.activity.create({
        data: {
          name: reqBody.name,
          count: reqBody.count,
          timestamp: newActivityTimestamp,
        },
        select: {
          id: true,
          name: true,
          count: true,
          timestamp: true,
        },
      }),
    ]);

    const timeSince = lastActivity?.timestamp
      ? formatDistance(lastActivity.timestamp, newActivity.timestamp, {
          includeSeconds: true,
          addSuffix: true,
        })
      : "never";

    const response = {
      created: newActivity,
      last: {
        ...lastActivity,
        since: timeSince,
      },
      // Adding 1 to include the activity that was just created
      trend: `${activityCount + 1} in last ${config.SUMMARY_WINDOW_DAYS} days`,
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
