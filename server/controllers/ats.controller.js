const pdf = require('pdf-parse');
const docxParser = require('docx-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scan = require('../models/scan.model');

// Initialize the Google AI client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Check resume against job description using Gemini AI and save result
// @route   POST /api/ats/check
// @access  Private
const checkAtsScore = async (req, res) => {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    if (!jobDescription || !resumeFile) {
        return res.status(400).json({ message: 'Job description and resume file are required.' });
    }

    let resumeText = '';

    try {
        // 1. Parse text from the uploaded file
        if (resumeFile.mimetype === 'application/pdf') {
            const data = await pdf(resumeFile.buffer);
            resumeText = data.text;
        } else if (resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const data = await new Promise((resolve, reject) => {
                docxParser.parse(resumeFile.buffer, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            resumeText = data.value;
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        // 2. Select the generative model --- MODIFIED MODEL NAME ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. Create the prompt for the AI
        const prompt = `
            Analyze the following resume against the provided job description. 
            Provide a detailed analysis in JSON format. The JSON object should have three properties:
            1. "score": An integer between 0 and 100 representing the match percentage.
            2. "matchedKeywords": An array of strings listing the key skills and technologies found in both the resume and the job description.
            3. "suggestions": An array of 3-5 strings giving specific, actionable advice on how to improve the resume to better match the job description.

            Here is the Job Description:
            ---
            ${jobDescription}
            ---

            Here is the Resume:
            ---
            ${resumeText}
            ---

            Return ONLY the JSON object. Do not include any other text or markdown formatting.
        `;

        // 4. Call the AI model
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 5. Clean and parse the JSON response from the AI
        text = text.replace('```json', '').replace('```', '').trim();
        const aiResult = JSON.parse(text);

        // 6. Save the scan to the database
        await Scan.create({
            userId: req.user._id,
            jobDescription: jobDescription.substring(0, 200) + '...',
            score: aiResult.score,
            matchedKeywords: aiResult.matchedKeywords,
            suggestions: aiResult.suggestions
        });

        // 7. Send the structured result back to the frontend
        res.status(200).json({
            success: true,
            score: aiResult.score,
            suggestions: aiResult.suggestions,
            matchedKeywords: aiResult.matchedKeywords,
        });

    } catch (error) {
        console.error("Error with file parsing or AI analysis:", error);
        res.status(500).json({ message: 'Failed to process your document. Please ensure it is not corrupted and try again.', error: error.message });
    }
};

const getScanHistory = async (req, res) => {
    try {
        const scans = await Scan.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(scans);
    } catch (error) {
        console.error("Error fetching scan history:", error);
        res.status(500).json({ message: "Server error while fetching history." });
    }
};

module.exports = {
    checkAtsScore,
    getScanHistory,
};