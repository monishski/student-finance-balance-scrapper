## Student Finance England Loan Balance Scrapper

This is a micro-project for scrapping the student loan balance from Student Finance England. The balance updates every **month** (mid way through the month?).
It's a short script that uses the *Puppeteer* package alongside *Mongoose* as the ORM to log data onto MongoDB (Atlas).

> :warning: You will need to create a **.env** file with the following keys **SF_USERNAME**, **SF_PASSWORD**, **SF_SECRET** and **MOGODB_URI** for the script to work

I use *Docker* to generalise its use (e.g. for those unfamiliar with Node ecosystem etc.)

1. 
```
  docker-compose build .
```