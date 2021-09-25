import express from "express";
import { app } from "./app.js";
import cors from 'cors'; // 引入cors插件
app.use(cors())
app.use(express.static("static"));
