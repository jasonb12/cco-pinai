"""
MCP Tool Registry for CCOPINAI
"""
from dataclasses import dataclass, field
from typing import Callable, Type, Dict, Any
from inspect import signature
import logging

from .schemas import BaseModel, ToolConfig, ToolType

logger = logging.getLogger(__name__)


@dataclass
class ToolMeta:
    name: str
    version: str
    tool_type: ToolType
    function: Callable
    input_schema: Type[BaseModel]
    output_schema: Type[BaseModel]
    default_params: Dict[str, Any] = field(default_factory=dict)
    oauth_required: bool = False
    description: str = ""


class MCPRegistry:
    """Registry for MCP tools and their metadata"""
    
    def __init__(self):
        self.tools: Dict[str, ToolMeta] = {}
        self.configs: Dict[str, ToolConfig] = {}
    
    def register_tool(
        self,
        name: str,
        version: str,
        tool_type: ToolType,
        oauth_required: bool = False,
        description: str = "",
        **default_params
    ):
        """Decorator to register a tool"""
        def decorator(func):
            sig = signature(func)
            params = list(sig.parameters.values())
            
            # Extract input and output types from function signature
            input_schema = params[0].annotation if params else BaseModel
            output_schema = sig.return_annotation if sig.return_annotation else BaseModel
            
            tool_meta = ToolMeta(
                name=name,
                version=version,
                tool_type=tool_type,
                function=func,
                input_schema=input_schema,
                output_schema=output_schema,
                default_params=default_params,
                oauth_required=oauth_required,
                description=description
            )
            
            self.tools[name] = tool_meta
            logger.info(f"Registered tool: {name} v{version}")
            return func
        return decorator
    
    def get_tool(self, name: str) -> ToolMeta:
        """Get tool metadata by name"""
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' not found in registry")
        return self.tools[name]
    
    def list_tools(self) -> Dict[str, ToolMeta]:
        """List all registered tools"""
        return self.tools.copy()
    
    def get_enabled_tools(self) -> Dict[str, ToolMeta]:
        """Get only enabled tools"""
        return {
            name: tool for name, tool in self.tools.items()
            if self.configs.get(name, ToolConfig(name=name, version=tool.version)).enabled
        }
    
    def update_tool_config(self, name: str, config: ToolConfig):
        """Update tool configuration"""
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' not found in registry")
        
        self.configs[name] = config
        logger.info(f"Updated config for tool: {name}")
    
    def get_tool_config(self, name: str) -> ToolConfig:
        """Get tool configuration"""
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' not found in registry")
        
        tool = self.tools[name]
        return self.configs.get(name, ToolConfig(
            name=name,
            version=tool.version,
            enabled=True,
            default_params=tool.default_params
        ))


# Global registry instance
registry = MCPRegistry()

# Convenience decorator
def tool(name: str, version: str = "1.0", tool_type: ToolType = ToolType.CUSTOM, **kwargs):
    """Decorator shorthand for registering tools"""
    return registry.register_tool(name, version, tool_type, **kwargs)