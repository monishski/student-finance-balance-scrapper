const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const sfLoanBalanceSchema = new mongoose.Schema({
  date: { type: Date },
  balance: { type: Number },
  direct_repayments: { type: Number },
  salary_repayments: { type: Number },
  interest_added: { type: Number },
  interest: { type: Number },
});

const sfLoanBalanceModel = mongoose.model("sfLoanBalance", sfLoanBalanceSchema);

dotenv.config();

const scrape = async () => {
  const MONGO_URI = process.env.MONGODB_URI;
  const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  };
  let db;
  mongoose
    .connect(MONGO_URI, MONGO_OPTIONS)
    .then((connection) => {
      db = connection;
      console.log("[CONNECTED TO DATABASE]");
    })
    .catch((err) =>
      console.log(`[FAILED TO CONNECT TO DATABASE] Error: ${err}`)
    );

  const browser = await puppeteer.launch({
    // headless: false,
    args: ["--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  const params = {
    svc: "ors",
    _locale: "en_GB_GOVUK",
    service:
      "https%3A%2F%2Fwww.manage-student-loan-balance.service.gov.uk%2Fors%2Faccount-overview%2Flogin%2Fcas",
  };
  const URL = `https://logon.slc.co.uk/cas/login?svc=${params.svc}&_locale=${params._locale}&service=${params.service}`;

  await page.goto(URL);

  await page.type("input[name=username]", process.env.SF_USERNAME);
  await page.type("input[name=password]", process.env.SF_PASSWORD);

  await page.click("#submitForm");
  // await page.waitForNavigation(); //this was causing a problem?

  await page
    .waitForSelector("#securityChar1_section")
    .then(async () => {
      for (let i = 1; i < 4; i++) {
        //3 characters from your secret
        const charLabels = await page.$eval(
          `#securityChar${i}_section`,
          (el) => el.innerText
        );
        const [_, charNumber] = charLabels.split(" ");
        await page.select(
          `#secret-answer-char${i}`,
          process.env.SF_SECRET[+charNumber - 1]
        );
      }
    })
    .catch((err) => console.log(err));

  await page.click("button[name=submitForm]");
  // await page.waitForNavigation();

  await page.waitForSelector("#balanceId_1");
  const balanceText = await page.$eval("#balanceId_1", (el) => el.innerText);
  const dateText = await page.$eval(
    "#asOfBalanceDateId-1",
    (el) => el.innerText
  );
  const interestText = await page.$eval(
    "#interestAsOfDateId-1",
    (el) => el.innerText
  );
  const salaryRepaymentText = await page.$eval(
    "#salaryRepaymentAmountId-1",
    (el) => el.innerText
  );
  const directRepaymentText = await page.$eval(
    "#directRepaymentAmountId-1",
    (el) => el.innerText
  );
  const interestAddedText = await page.$eval(
    "#interestAddedAmountId-1",
    (el) => el.innerText
  );

  const balance = Number(balanceText.replace(/[^0-9.-]+/g, ""));
  const date = new Date(Date.parse(dateText.replace("as of ", "")));
  const interest = Number(interestText.replace(/[^0-9.]+/g, ""));
  const salary_repayments = Number(
    salaryRepaymentText.replace(/[^0-9.]+/g, "")
  );
  const direct_repayments = Number(
    directRepaymentText.replace(/[^0-9.]+/g, "")
  );
  const interest_added = Number(interestAddedText.replace(/[^0-9.]+/g, ""));

  const snapshot = new sfLoanBalanceModel({
    balance,
    date,
    interest,
    salary_repayments,
    direct_repayments,
    interest_added,
  });
  await snapshot.save();

  await browser.close();

  db.disconnect().then(() => () => {
    console.log("[DISCONNECTING FROM DATABASE]");
  });
};

scrape().then(() => process.exit());
