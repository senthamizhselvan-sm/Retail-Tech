import api from './api';

const API_URL = '/communication';

class CommunicationService {
    // Generate AI reply - NOW WITH SMART MODE
    async generateAIReply(
        context: string,
        category: string,
        language: string,
        customerInfo?: any,
        smartMode: boolean = true
    ) {
        const response = await api.post(
            `${API_URL}/generate-reply`,
            { context, category, language, customerInfo, smartMode },
            { timeout: 20000 } // Increased timeout for inventory fetch
        );
        return response.data;
    }

    // Get inventory summary
    async getInventorySummary() {
        const response = await api.get(
            `${API_URL}/inventory-summary`
        );
        return response.data;
    }

    // Process voice input for customer query
    async processVoiceQuery(transcript: string, language: string) {
        const response = await api.post(
            `${API_URL}/voice-query`,
            { transcript, language }
        );
        return response.data;
    }

    // Get conversation history
    async getConversationHistory(limit: number = 10) {
        const response = await api.get(
            `${API_URL}/history?limit=${limit}`
        );
        return response.data;
    }

    // Save conversation
    async saveConversation(conversation: any) {
        const response = await api.post(
            `${API_URL}/save-conversation`,
            conversation
        );
        return response.data;
    }

    // Get smart suggestions based on inventory
    async getSmartSuggestions(query: string) {
        const response = await api.post(
            `${API_URL}/suggestions`,
            { query }
        );
        return response.data;
    }
}

export default new CommunicationService();
