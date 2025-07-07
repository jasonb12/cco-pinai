"""
Action Extraction Tool - Core AI processing for identifying actionable items
"""
import json
import logging
from typing import List, Dict, Any
from datetime import datetime
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, SystemMessage

from ..schemas import TextInput, ActionOutput, ExtractedAction, ToolType, ActionStatus
from ..registry import tool

logger = logging.getLogger(__name__)


EXTRACTION_PROMPT = """
You are an AI assistant that extracts actionable items from meeting transcripts and conversations.

Analyze the following transcript and identify specific actions that should be taken. For each action, determine:
1. What tool/service should handle it (calendar, email, task, contact, reminder)
2. The specific parameters needed
3. Your confidence level (0.0-1.0)
4. Brief reasoning

Focus on:
- Explicit commitments ("I'll send that to you", "Let's schedule a meeting")
- Deadlines and time-sensitive items
- Follow-up actions
- Contact information exchanges
- Task assignments

Return a JSON object with this structure:
{
  "actions": [
    {
      "tool_type": "calendar|email|task|contact|reminder",
      "tool_name": "specific_tool_name",
      "payload": {
        "title": "Action title",
        "description": "Detailed description",
        "due_date": "2024-01-15T10:00:00Z",  // if applicable
        "recipient": "email@example.com",    // if applicable
        "priority": "high|medium|low"
      },
      "confidence": 0.85,
      "reasoning": "Why this action was identified"
    }
  ],
  "confidence": 0.9,
  "reasoning": "Overall analysis reasoning"
}

Transcript:
{transcript}
"""


@tool(
    name="extract_actions",
    version="1.0",
    tool_type=ToolType.CUSTOM,
    description="Extract actionable items from transcript text using AI"
)
def extract_actions(input_data: TextInput) -> ActionOutput:
    """
    Extract actionable items from transcript text
    
    Args:
        input_data: TextInput containing the transcript
        
    Returns:
        ActionOutput with extracted actions and confidence
    """
    try:
        # Initialize LLM
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.1,
            max_tokens=2000
        )
        
        # Create prompt
        prompt = PromptTemplate.from_template(EXTRACTION_PROMPT)
        formatted_prompt = prompt.format(transcript=input_data.text)
        
        # Get AI response
        messages = [
            SystemMessage(content="You are a helpful assistant that extracts actionable items from text."),
            HumanMessage(content=formatted_prompt)
        ]
        
        response = llm.invoke(messages)
        
        # Parse JSON response
        try:
            result = json.loads(response.content)
            
            # Validate structure
            if "actions" not in result:
                result["actions"] = []
            if "confidence" not in result:
                result["confidence"] = 0.5
            if "reasoning" not in result:
                result["reasoning"] = "AI analysis completed"
                
            return ActionOutput(**result)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response was: {response.content}")
            
            # Return fallback response
            return ActionOutput(
                actions=[],
                confidence=0.0,
                reasoning=f"Failed to parse AI response: {str(e)}"
            )
            
    except Exception as e:
        logger.error(f"Error extracting actions: {e}")
        return ActionOutput(
            actions=[],
            confidence=0.0,
            reasoning=f"Error during extraction: {str(e)}"
        )


def convert_to_extracted_actions(
    action_output: ActionOutput,
    transcript_id: str,
    user_id: str
) -> List[ExtractedAction]:
    """
    Convert ActionOutput to ExtractedAction objects for database storage
    
    Args:
        action_output: Output from extract_actions
        transcript_id: ID of the source transcript
        user_id: ID of the user
        
    Returns:
        List of ExtractedAction objects
    """
    extracted_actions = []
    
    for action_data in action_output.actions:
        try:
            # Map tool_type string to enum
            tool_type_map = {
                "calendar": ToolType.CALENDAR,
                "email": ToolType.EMAIL,
                "task": ToolType.TASK,
                "contact": ToolType.CONTACT,
                "reminder": ToolType.REMINDER,
                "custom": ToolType.CUSTOM
            }
            
            tool_type = tool_type_map.get(
                action_data.get("tool_type", "custom").lower(),
                ToolType.CUSTOM
            )
            
            extracted_action = ExtractedAction(
                id=f"action_{datetime.utcnow().timestamp()}_{len(extracted_actions)}",
                transcript_id=transcript_id,
                tool_type=tool_type,
                tool_name=action_data.get("tool_name", "unknown"),
                payload=action_data.get("payload", {}),
                confidence=action_data.get("confidence", 0.5),
                reasoning=action_data.get("reasoning", ""),
                status=ActionStatus.PENDING,
                created_at=datetime.utcnow(),
                user_id=user_id
            )
            
            extracted_actions.append(extracted_action)
            
        except Exception as e:
            logger.error(f"Error converting action to ExtractedAction: {e}")
            continue
    
    return extracted_actions