"use strict";
/* Celedonio G.
 * NAME: RampUp.ts
 * DESC: Determine how easy it is for a developer to get started setting up and
 * using a given packaage. Fetch a packages' README file, then use ChatGPT to
 * anaylze the above. Based on the issue from GitHub:
 * We will grab the readme for the given node package, and then use the GPT API to get a score for the rampup.
 * Below is the prompt to do so: Prompt: Here is a readme for a node package.
 * I want to calculate the ramp up score, which means how easy it is for a developer to get started with this
 * package. analyze the following readme for this package and give me a score for the package from 0 to 1
 * for the ramp up score. Give me the score only in a json format with the key as ramp_up_score and
 * value to be the score you decide. If the readme does not exist, the score is 0.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RampUp = void 0;
const Metric_1 = require("./Metric");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
class RampUp extends Metric_1.Metric {
    constructor(url) {
        super(url);
        this.weight = 0.15;
        this.owner = '';
        this.repo = '';
        this.openaiToken = '';
        this.packageName = '';
        // set up based on which link is provided.
        if (url.includes('github.com')) {
            const parts = url.split('/');
            this.owner = parts[3];
            this.repo = parts[4];
        }
        else if (url.includes('npmjs.com')) {
            const parts = url.split('/');
            this.packageName = parts[4];
        }
    }
    // methods for retrieval and scoring.
    // PURPOSE: Delay a process so that an API is not flooded with calls.
    // EXPECTED OUTPUT: A new promise after waiting x ms. (Promise<void>).
    // PARAMTERS: ms: number (the amount to wait in ms before trying again).
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // PURPOSE: List the contents of a GitHub url so that I can find the
    // specific contents later.
    // EXPECTED OUTPUT: An array that contains things like 'license.md',
    // 'readme.md', etc. (string[]).
    // PARAMETERS: None.
    listRepoFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const apiURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/`;
            try {
                const response = yield axios_1.default.get(apiURL, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    }
                });
                return response.data;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('Error fetching repo files:', error.message);
                    return [];
                }
                else {
                    console.error('An unknown error occured');
                    return [];
                }
            }
        });
    }
    // PURPOSE: Get a particular file.
    // EXPECTED OUTPUT: Data retrieved from an GET request.
    // PARAMETERS: filePath: string (readme files might be a particular format,
    // need to specifiy which one to get).
    getFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiURL = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filePath}`;
            try {
                const response = yield axios_1.default.get(apiURL, {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    }
                });
                return response.data;
            }
            catch (error) {
                if (error instanceof Error) {
                    // console.error(`Error fetching ${filePath}:`, error.message);
                    return null;
                }
                else {
                    console.error('An unknown error has occurred');
                    return null;
                }
            }
        });
    }
    // PURPOSE: Once a file is retrieved, decode it to string to get its
    // content.
    // EXPECTED OUTPUT: The content of a file. (string).
    // PARAMETERS: encodedContent: string (the content gotten after making a
    // get request).
    decodeFile(encodedContent) {
        const theBuffer = Buffer.from(encodedContent, 'base64');
        return theBuffer.toString('utf-8');
    }
    // PURPOSE: Retrieve the contents of a GitHub url, find the README file by
    // comparing it to the three most common file types. Then decode it to rate
    // it.
    // EXPECTED OUTPUT: It either returns the content of the readme file or
    // nothing at all (b/c it failed). (String | NULL).
    // PARAMTERS: None.
    findREADME() {
        return __awaiter(this, void 0, void 0, function* () {
            const repoFiles = yield this.listRepoFiles();
            const fileTypes = ['readme', 'readme.txt', 'readme.md'];
            for (const file of repoFiles) {
                if (typeof file === 'string') {
                    const normalizedFileName = file.toLowerCase();
                    if (fileTypes.includes(normalizedFileName)) {
                        const fileData = yield this.getFile(file);
                        if (fileData && fileData.content) {
                            const decodedContent = this.decodeFile(fileData.content);
                            return decodedContent;
                        }
                    }
                    yield this.delay(1000);
                }
                else {
                    // console.warn(`Unexpected file type: ${typeof file}`, file);
                }
            }
            // if no readme was found, return null.
            return '';
        });
    }
    // PURPOSE: If an npmjs url was given, this is the method to call to fetch
    // the contents of the url.
    // EXPECTED OUTPUT: List the content of the url (looking for README).
    // PARAMETERS: none.
    getNPMData() {
        return __awaiter(this, void 0, void 0, function* () {
            const apiURL = `https://registry.npmjs.org/${this.packageName}`;
            try {
                const response = yield axios_1.default.get(apiURL);
                return response.data;
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('Error fetching NPM metadata:', error.message);
                    return null;
                }
                else {
                    console.error('An unknown error has occurred');
                    return null;
                }
            }
        });
    }
    // PURPOSE: After fetching the contents of the url, get the readme content
    // from the metadata.
    // EXPECTED OUTPUT: Rhe content of the readme (string | NULL).
    // PARAMETERS: None.
    findNPMREADME() {
        return __awaiter(this, void 0, void 0, function* () {
            const metadata = yield this.getNPMData();
            if (metadata && metadata.readme) {
                return metadata.readme;
            }
            else {
                console.warn('No readme found in the NPM metadata');
                return '';
            }
        });
    }
    // GPT integration.
    rateREADME(content) {
        return __awaiter(this, void 0, void 0, function* () {
            dotenv_1.default.config();
            if (process.env.OPENAI_API_KEY) {
                this.openaiToken = process.env.OPENAI_API_KEY;
            }
            const client = new openai_1.default({
                apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
            });
            const chatCompletion = yield client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert in evaluating readme files." },
                    { role: "user", content: `Here is the readme file: "${content}".\nI want to calculate the ramp up score, which means how easy it is for a developer to get started with this package.\nAnalyze the following readme and give me a score for the package between 0 and 1. Give me only the score in JSON format with the key as ramp_up_score and the value to be the score you decide.\nIf a readme doesn't exist, the score is 0.` },
                ],
                model: 'gpt-3.5-turbo',
                temperature: 0
            });
            //convert the response to a json object.
            const response = chatCompletion.choices[0].message.content;
            if (response) {
                // Convert the response to a JSON object
                try {
                    const jsonResponse = JSON.parse(response);
                    // Access the ramp_up_score value
                    const rampUpScore = jsonResponse.ramp_up_score;
                    //console.log("RampUp Score: ", rampUpScore);
                    return rampUpScore;
                }
                catch (error) {
                    console.error("Failed to parse the response:", error);
                    return 0; // Handle the case where the JSON parsing fails
                }
            }
            else {
                console.error("Received a null or undefined response");
                return 0; // Handle the case where response is null or undefined
            }
        });
    }
    // Method that gets called depends on the type of url that was given.
    // PURPOSE: Calculate the score of a package in terms of ramp up time.
    // EXPECTED OUTPUT: None.
    // PARAMETERS: None.
    calculateScoreGithub() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating RampUp");
            const start = performance.now();
            const readmeContent = yield this.findREADME();
            const readmeRating = yield this.rateREADME(readmeContent);
            const end = performance.now();
            this.latency = end - start;
            this.score = readmeRating;
        });
    }
    // PURPOSE: Calculate the score of a package in terms of ramp up time.
    // EXPECTED OUTPUT: None.
    // PARAMETERS: None.
    calculateScoreNPM() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Calculating RampUp");
            const start = performance.now();
            const readmeContent = yield this.findNPMREADME();
            const readmeRating = yield this.rateREADME(readmeContent);
            const end = performance.now();
            this.latency = end - start;
            this.score = readmeRating;
        });
    }
}
exports.RampUp = RampUp;
