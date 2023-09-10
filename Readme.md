# Task Logics

An application which helps you to create tasks and keep track of them.

Frontend of task logics can be [found here.](https://github.com/Maazsid/task-logics)

[Go to Task Logics](https://tasklogics.live)

# Getting Started

The following instructions will get the project running on your local machine for development and testing.

## Prerequisites

You will need the following software and services:

- postgreSQL
- A google cloud account with the Google OAuth Consent screen setup.
- A SendGrid account with API key for the email services and a templateId for the email UI.

## Installing

To run the project locally:

- Clone this repo
- `npm install` to install all the dependencies
- Create a .env file using the .env.example file
- run `npx prisma migrate dev` to run all the migrations and seedings.
- Setup your Google OAuth consent screen on Google Cloud and insert ClientId and ClientSecret in .env file.
- Create a SendGrid account and get an email API key and insert it in the .env file.
- `npm start` to start the local server on port 3000
- To run the project in debug mode select `Debug Task Logics` in the debug configuration inside VSCode and then press F5.


# Built With

- Node.js, Express, Joi, Passport
- Prisma, PostgreSQL
- SendGrid