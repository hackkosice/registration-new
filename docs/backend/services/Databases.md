## Services: Database


# TOC:

1. Usage
2. Providers
3. Function reference


=====================================

# 1. Usage

Database service provides full database access for SQL and NoSQL (Planed) databases. To utilize the databases in the project, you need to choose the provider
from the list in the section 2. by "requireing it". Then call the constructor on given class.


Example for MySQL database:

const database = require('./services/database/mysql.js');

const connection = new database("user", "password");
