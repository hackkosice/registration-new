# registration-new

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
  
