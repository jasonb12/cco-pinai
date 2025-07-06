#!/usr/bin/env python3
import subprocess
import sys
import os

def create_venv():
    """Create virtual environment"""
    subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
    
def install_requirements():
    """Install requirements in virtual environment"""
    venv_python = os.path.join('venv', 'bin', 'python') if os.name != 'nt' else os.path.join('venv', 'Scripts', 'python.exe')
    subprocess.run([venv_python, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)

if __name__ == '__main__':
    print("Setting up Python backend...")
    create_venv()
    install_requirements()
    print("Backend setup complete!")