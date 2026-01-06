/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import httpStatus from "http-status-codes";



const transporter = nodemailer.createTransport({
    // port: envVars.EMAIL_SENDER.SMTP_PORT,
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
    host: envVars.EMAIL_SENDER.SMTP_HOST
});

interface SendEmailOptions {
    to: string;
    cc?: string;
    subject: string;
    templateName: string;
    templateData?: Record<string, any>
    attachments?: {
        filename: string,
        content: Buffer | string,
        contentType: string
    }[]
};

export const sendEmail = async ({
    to,
    cc,
    subject,
    templateName,
    templateData,
    attachments
}: SendEmailOptions) => {
    try {
        const templatePath = path.join(__dirname, `templates/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, templateData);
        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to: to,
            cc: cc? cc : undefined,
            subject: subject,
            html: html,
            attachments: attachments?.map(attachment => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType
            }))
        });

        if (envVars.NODE_ENV === "development") {
            console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);
        };
    } catch (error: any) {
        // if (envVars.NODE_ENV === "development") {
            console.log("email sending error", error);
        // };
        throw new AppError(httpStatus.EXPECTATION_FAILED, error.message || "Failed to send email.");
    }
};