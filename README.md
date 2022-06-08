# registration-new

Source code of Hack Kosice application portal, created for Hack Kosice 2022, replacing the old one written in django. Backend is written using Javascript and NodeJS, with implemented MySQL and SQLite database providers (deployed portal uses SQLite with weekly backups). Frontend, being mostly static pages, is written in vanilla HTML/CSS with functionality added via Javascript.

The portal itself consists of three sections, one for users (to apply), one for judges (to judge applications and invite participants to hackathon) and one for sponsors (to retrieve user data), each with it's own auth. To run a local instance of the portal, you'll need to suply MyMLH and GSuite api keys.

### Installation

1. Download this code to the target directory
2. Download all required dependencies by running:
```
npm install
```

3. Set up database by issuing commands in **sqlcommands** file
4. Set up runtime environment by creating *.env* file using the structure found in **.env.example**
5. Put all API keys into *.env* file
6. Compile styling for webpage by running
```
npm run css-build
```

### Starting
To start the application in debug mode, run:
```
npm run start
```
This starts it with nodemon and emails will not be sent out.

To start the application in production mode, run:
```
npm run start:production
```

### Adding users as admins

To add user as admin (allowing him/her to see, rate and invite applications) run
```
npm run useradd
```

This will give you a link you need to give the user to finish registration
