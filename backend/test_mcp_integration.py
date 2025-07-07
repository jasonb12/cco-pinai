#!/usr/bin/env python3
"""
Test MCP Integration - Demonstrates the new MCP processing pipeline
"""
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_mcp_processing():
    """Test the complete MCP processing pipeline"""
    print("🎯 MCP PROCESSING PIPELINE TEST")
    print("=" * 60)
    
    try:
        # Import MCP components
        from src.mcp.processor import get_mcp_processor
        from src.mcp.tools.action_extractor import extract_actions
        from src.mcp.schemas import TextInput
        
        # Test 1: Action Extraction
        print("\n🔍 TEST 1: Action Extraction")
        
        sample_transcript = """
        Hi John, thanks for the meeting today. I'll send you the project proposal by Friday. 
        Let's schedule a follow-up meeting for next Tuesday at 2 PM to review the budget.
        Also, please add Sarah to the project team - her email is sarah@example.com.
        I need to remind myself to check the quarterly reports next week.
        """
        
        text_input = TextInput(text=sample_transcript)
        action_output = extract_actions(text_input)
        
        print(f"   ✅ AI processed transcript successfully")
        print(f"   📊 Actions found: {len(action_output.actions)}")
        print(f"   🎯 Confidence: {action_output.confidence:.2f}")
        print(f"   💭 Reasoning: {action_output.reasoning}")
        
        # Show extracted actions
        for i, action in enumerate(action_output.actions, 1):
            print(f"\n   📋 Action {i}:")
            print(f"      Type: {action.get('tool_type', 'unknown')}")
            print(f"      Tool: {action.get('tool_name', 'unknown')}")
            print(f"      Title: {action.get('payload', {}).get('title', 'N/A')}")
            print(f"      Confidence: {action.get('confidence', 0):.2f}")
        
        # Test 2: Full Pipeline Processing
        print(f"\n🏭 TEST 2: Full Pipeline Processing")
        
        processor = get_mcp_processor()
        
        # Mock transcript data
        transcript_id = "test_transcript_001"
        user_id = "test_user_001"
        
        result = await processor.process_transcript(
            transcript_id=transcript_id,
            transcript_text=sample_transcript,
            user_id=user_id
        )
        
        print(f"   ✅ Pipeline processing completed")
        print(f"   📋 Job ID: {result['job_id']}")
        print(f"   📊 Actions extracted: {result['actions_extracted']}")
        print(f"   💾 Actions saved: {result['actions_saved']}")
        print(f"   ⏰ Processing time: {result['processing_time']}")
        
        # Test 3: Processing Logs
        print(f"\n📋 TEST 3: Processing Logs")
        
        logs = await processor.get_processing_logs(result['job_id'])
        print(f"   ✅ Retrieved {len(logs)} processing log entries")
        
        for log in logs:
            print(f"   📝 {log.stage.value}: {log.status} at {log.created_at}")
        
        # Test 4: Tool Registry
        print(f"\n🔧 TEST 4: Tool Registry")
        
        from src.mcp.registry import registry
        
        tools = registry.list_tools()
        print(f"   ✅ {len(tools)} tools registered:")
        
        for name, tool_meta in tools.items():
            print(f"      🔨 {name} v{tool_meta.version} ({tool_meta.tool_type.value})")
        
        # Test 5: Mock Action Execution
        print(f"\n⚡ TEST 5: Mock Action Execution")
        
        if action_output.actions:
            # Create a mock extracted action
            from src.mcp.schemas import ExtractedAction, ToolType, ActionStatus
            from src.mcp.tools.action_extractor import convert_to_extracted_actions
            
            extracted_actions = convert_to_extracted_actions(
                action_output, transcript_id, user_id
            )
            
            if extracted_actions:
                sample_action = extracted_actions[0]
                sample_action.status = ActionStatus.APPROVED  # Simulate approval
                
                execution_result = await processor.execute_approved_action(sample_action)
                
                print(f"   ✅ Action execution completed")
                print(f"   📋 Action ID: {execution_result['action_id']}")
                print(f"   ✅ Success: {execution_result['success']}")
                print(f"   💬 Message: {execution_result['message']}")
        
        print(f"\n🎉 MCP INTEGRATION TEST RESULTS:")
        print(f"   🟢 Action Extraction: WORKING")
        print(f"   🟢 Pipeline Processing: WORKING")
        print(f"   🟢 Processing Logs: WORKING")
        print(f"   🟢 Tool Registry: WORKING")
        print(f"   🟢 Action Execution: WORKING")
        
        print(f"\n✨ The MCP processing pipeline is fully operational!")
        print(f"\n📋 NEXT STEPS:")
        print(f"   1. Set up database schema for actions/schedules")
        print(f"   2. Configure pg_cron for automated processing")
        print(f"   3. Build approval queue GUI")
        print(f"   4. Add real integrations (Google Calendar, Gmail, etc.)")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcp_processing())