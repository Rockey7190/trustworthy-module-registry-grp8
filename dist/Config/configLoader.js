"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
// Load and parse the YAML configuration file
const loadConfig = () => {
    const file = fs_1.default.readFileSync('./config.yaml', 'utf8'); // Ensure this path is correct
    return yaml_1.default.parse(file);
};
const config = loadConfig();
exports.default = config;
