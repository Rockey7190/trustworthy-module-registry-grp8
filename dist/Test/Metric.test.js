"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Metric_1 = require("../Models/Metric");
describe('Metric', () => {
    it('should have a score and latency initialized to 0', () => {
        class TestMetric extends Metric_1.Metric {
            constructor() {
                super(...arguments);
                this.weight = 0.5;
            }
            calculateScoreGithub() { console.log("Method not implemented."); }
            calculateScoreNPM() {
                console.log("Method not implemented.");
            }
        }
        const metric = new TestMetric('https://github.com/cloudinary/cloudinary_npm');
        (0, chai_1.expect)(metric.getScore()).to.equal(0);
        (0, chai_1.expect)(metric.getLatency()).to.equal(0);
    });
    it('should be an instance of Metric', () => {
        class TestMetric extends Metric_1.Metric {
            constructor() {
                super(...arguments);
                this.weight = 0.5;
            }
            calculateScoreGithub() { }
            calculateScoreNPM() { }
        }
        const metric = new TestMetric('https://github.com/cloudinary/cloudinary_npm');
        (0, chai_1.expect)(metric).to.be.an.instanceOf(Metric_1.Metric);
    });
});
