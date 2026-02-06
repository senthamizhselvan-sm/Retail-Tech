const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AI Orchestrator - Translates user requests into API workflows

// Step 1: Convert user instruction to Gemini Task Request
async function analyzeUserRequest(userRequest) {
  try {
    // For now, use simple analysis since Gemini might not be available
    return fallbackAnalysis(userRequest);
  } catch (error) {
    console.error('Request analysis failed:', error);
    return fallbackAnalysis(userRequest);
  }
}

// Fallback analysis when Gemini is unavailable
function fallbackAnalysis(userRequest) {
  const request = userRequest.toLowerCase();
  let apiList = [];
  let operations = [];
  let payloads = [];

  if (request.includes('create') || request.includes('generate') || request.includes('make') || request.includes('brochure') || request.includes('design')) {
    apiList.push('image_generation');
    operations.push('Generate new image based on user description');
    payloads.push({
      prompt: userRequest,
      style: 'professional',
      size: '1024x1024'
    });
  }

  if (request.includes('edit') || request.includes('modify') || request.includes('change')) {
    apiList.push('image_editing');
    operations.push('Edit existing image according to user instructions');
    payloads.push({
      prompt: userRequest,
      editType: 'enhance'
    });
  }

  if (request.includes('background') && request.includes('remove')) {
    apiList.push('background_removal');
    operations.push('Remove background from image');
    payloads.push({
      prompt: userRequest,
      editType: 'remove-bg'
    });
  }

  // If no specific API detected, default to image generation
  if (apiList.length === 0) {
    apiList.push('image_generation');
    operations.push('Generate image based on user request');
    payloads.push({
      prompt: userRequest,
      style: 'professional',
      size: '1024x1024'
    });
  }

  return {
    api_list: apiList,
    operations: operations,
    payloads: payloads,
    comments: 'Auto-analyzed user request'
  };
}

// Step 2: Execute API sequence
async function executeAPISequence(apiWorkflow, inputData = {}) {
  const results = [];
  let currentInput = inputData;

  console.log(`🤖 Executing API sequence: ${apiWorkflow.api_list.join(' → ')}`);

  for (let i = 0; i < apiWorkflow.api_list.length; i++) {
    const apiName = apiWorkflow.api_list[i];
    const payload = apiWorkflow.payloads[i] || {};
    const operation = apiWorkflow.operations[i] || '';

    console.log(`📡 Step ${i + 1}: ${apiName} - ${operation}`);

    try {
      const result = await executeAPI(apiName, payload, currentInput);

      // Extract only the data part to avoid circular references
      const cleanResult = {
        success: true,
        api: apiName,
        data: result.data,
        status: result.status
      };

      results.push(cleanResult);

      // Use output as input for next step if needed
      if (result.data && (result.data.editedImage || result.data.images)) {
        currentInput.imageUrl = result.data.editedImage || result.data.images[0];
      }

    } catch (error) {
      console.error(`❌ API ${apiName} failed:`, error.message);
      results.push({
        success: false,
        error: error.message,
        api: apiName
      });
    }
  }

  return results;
}

// Execute individual API
async function executeAPI(apiName, payload, inputData) {
  const baseURL = 'http://localhost:5000/api';

  switch (apiName) {
    case 'image_generation':
      return await axios.post(`${baseURL}/ai/generate`, {
        prompt: payload.prompt,
        style: payload.style || 'professional',
        size: payload.size || '1024x1024',
        count: payload.count || 1,
        enhancePrompt: false // Disable double enhancement
      });

    case 'image_editing':
    case 'background_removal':
      return await axios.post(`${baseURL}/ai/edit`, {
        imageUrl: inputData.imageUrl,
        imageBase64: inputData.imageBase64,
        prompt: payload.prompt,
        editType: payload.editType || 'enhance'
      });

    default:
      throw new Error(`Unknown API: ${apiName}`);
  }
}

// Step 3: Process final output
function processFinalOutput(results, originalRequest) {
  const finalResult = results[results.length - 1];

  if (!finalResult || !finalResult.data) {
    return {
      success: false,
      message: 'No valid output generated',
      originalRequest: originalRequest,
      results: results
    };
  }

  return {
    success: true,
    message: 'AI workflow completed successfully',
    originalRequest: originalRequest,
    finalOutput: finalResult.data,
    workflowSteps: results.length,
    processingTime: Date.now(),
    results: results
  };
}

// Main orchestrator endpoint
const orchestrateAI = async (req, res) => {
  try {
    const { userRequest, inputData } = req.body;

    if (!userRequest) {
      return res.status(400).json({
        success: false,
        message: 'User request is required'
      });
    }

    console.log(`🎯 AI Orchestrator received: "${userRequest}"`);

    // Step 1: Analyze user request
    console.log('📋 Step 1: Analyzing user request...');
    const workflow = await analyzeUserRequest(userRequest);

    console.log('🔍 Workflow analysis:', {
      apis: workflow.api_list,
      steps: workflow.operations.length,
      comments: workflow.comments
    });

    // Step 2: Execute API sequence
    console.log('⚡ Step 2: Executing API sequence...');
    const results = await executeAPISequence(workflow, inputData || {});

    // Step 3: Process final output
    console.log('✨ Step 3: Processing final output...');
    const finalOutput = processFinalOutput(results, userRequest);

    console.log('🎉 AI Orchestration complete!');

    res.json({
      success: true,
      message: 'AI orchestration completed',
      userRequest: userRequest,
      workflow: workflow,
      finalOutput: finalOutput,
      executionSteps: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Orchestration error:', error);

    res.status(500).json({
      success: false,
      message: 'AI orchestration failed',
      error: error.message
    });
  }
};

module.exports = { orchestrateAI };
