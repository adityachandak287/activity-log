# Activity Log

Simple HTTP endpoint to maintain a log of activities. Deployed on AWS Lambda using Serverless Framework v3.

## Setup

Run this command to initialize a new project in a new working directory.

```shell
npm install
```

## Usage

**Deploy**

```shell
$ serverless deploy
```

**Invoke the function locally.**

```shell
serverless invoke local --function logActivity
```

## Resources

### Creating minimal AWS IAM policy

[Serverless Permission Policy Generator](https://open-sl.github.io/serverless-permission-generator)

NOTE: this is not perfect, had to add the following policies based on errors while running `serverless deploy`

```
cloudformation:CreateChangeSet
cloudformation:DeleteChangeSet
cloudformation:ExecuteChangeSet
lambda:TagResource
logs:TagResource
apigateway:TagResource
arn:aws:apigateway:*::/tags*
```
