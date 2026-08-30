import Exam from "../models/Exam.js";
import Violation from "../models/Violation.js";

// ============================================================================
// CONCEPT 1: Closures
// A closure is a function that remembers its outer lexical environment.
// Here we create a violation counter that keeps its state private, even 
// after the outer function has returned.
// ============================================================================
const createViolationCounter = () => {
  let count = 0; // Private variable captured by the closure
  return () => {
    count++;
    return count;
  };
};
const getSessionViolationCount = createViolationCounter();


export const createViolation = async (req, res) => {
  try {
    const { examId, type, severity, description } = req.body || {};
    
    // ============================================================================
    // CONCEPT 2: Hoisting
    // We are calling `validateViolationInput` here, even though it is defined 
    // at the very bottom of this file. Because it's declared with the `function` 
    // keyword, JavaScript "hoists" the declaration to the top of the scope.
    // ============================================================================
    const isValid = validateViolationInput(examId, type);
    if (!isValid) {
      return res.status(400).json({ message: "examId and type are required" });
    }

    const exam = await Exam.findById(examId).select("createdBy").lean();
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const doc = await Violation.create({
      student: req.user._id,
      exam: examId,
      mentor: exam.createdBy,
      type,
      severity: severity || "Medium",
      description: description || "",
      timestamp: new Date(),
    });

    // Closure in action: Increment and log securely
    const currentCount = getSessionViolationCount();
    console.log(`[Closure Demo] Total violations handled in this server session: ${currentCount}`);

    // Send the response immediately! The output remains EXACTLY the same for the user.
    res.status(201).json({ message: "Violation recorded", id: doc._id });

    // ============================================================================
    // CONCEPT 3: The Event Loop
    // By using setImmediate, we defer the AI analysis to the next iteration of the 
    // Node.js Event Loop. This ensures the API responds to the frontend immediately,
    // without blocking the main thread while doing "heavy" background work.
    // ============================================================================
    setImmediate(() => {
      analyzeViolationBehavior(doc);
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ============================================================================
// CONCEPT 4: Promises vs Callbacks
// Demonstrating the difference between the old callback pattern and the 
// modern Promise pattern for asynchronous tasks.
// ============================================================================

// Callback approach (older style - deeply nested "callback hell" potential)
const mockSaveLogCallback = (logData, callback) => {
  setTimeout(() => {
    callback(null, "[Promises vs Callbacks] Log saved successfully via callback");
  }, 50);
};

// Promise approach (modern style - allows async/await)
const mockSaveLogPromise = (logData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("[Promises vs Callbacks] Log saved successfully via Promise");
    }, 50);
  });
};


// ============================================================================
// CONCEPT 5: Prompt Engineering & Structured Outputs
// We simulate an LLM analyzing the violation behavior.
// ============================================================================
const analyzeViolationBehavior = async (violationDoc) => {
  try {
    // Prompt Engineering: Giving the AI a specific persona, context, and strict constraints.
    const systemPrompt = `You are an expert AI proctoring analyst for Watchify. 
Your job is to evaluate student examination violations and determine if they require human review.`;
    
    // Structured Outputs: Forcing the LLM to reply ONLY with a predefined JSON schema
    const userPrompt = `
Analyze the following violation:
Type: ${violationDoc.type}
Severity: ${violationDoc.severity}

Respond ONLY with a JSON object in this exact strict structure:
{
  "requiresReview": boolean,
  "confidenceScore": number (0-100),
  "analysis": "short string explaining why"
}
`;

    // Simulated LLM delay...
    
    // Simulated Structured Output (JSON) exactly matching the requested format
    const simulatedStructuredOutput = {
      requiresReview: violationDoc.severity === "High" || violationDoc.type.includes("camera"),
      confidenceScore: 88,
      analysis: `The violation type '${violationDoc.type}' triggered an automated review flag based on predefined severity rules.`
    };

    console.log("\n--- [Prompt Eng. & Structured Output Demo] ---");
    console.log("System Prompt: ", systemPrompt);
    console.log("User Prompt: ", userPrompt);
    console.log("Structured JSON Output: ", simulatedStructuredOutput);
    console.log("----------------------------------------------\n");

    // Executing the Callback approach
    mockSaveLogCallback(simulatedStructuredOutput, (err, result) => {
      if (err) console.error(err);
      else console.log(result);
    });

    // Executing the Promise approach
    const promiseResult = await mockSaveLogPromise(simulatedStructuredOutput);
    console.log(promiseResult);

  } catch (error) {
    console.error("Background AI task failed:", error);
  }
};

// ============================================================================
// CONCEPT 2 TARGET: Hoisting
// This function declaration is "hoisted" to the top of the file's scope at 
// runtime, which is why we could call it inside `createViolation` above before 
// it was defined sequentially in the file.
// ============================================================================
function validateViolationInput(examId, type) {
  return !!(examId && type);
}
