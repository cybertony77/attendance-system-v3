#!/usr/bin/env python3
"""
WhatsApp Web Setup Script
This script opens WhatsApp Web for initial authentication
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from whatsapp import setup_whatsapp_web

def main():
    print("🚀 WhatsApp Web Setup")
    print("=" * 50)
    print("This script will open WhatsApp Web in your browser.")
    print("Please scan the QR code with your phone to authenticate.")
    print("After scanning, you can close this script.")
    print("=" * 50)
    
    try:
        driver = setup_whatsapp_web(quiet=False)
        print("\n✅ WhatsApp Web opened successfully!")
        print("📱 Please scan the QR code with your phone")
        print("🔒 After scanning, WhatsApp Web will be authenticated for future use")
        print("\nPress Enter to close the browser...")
        input()
        driver.quit()
        print("✅ Setup completed!")
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        print("Please make sure Chrome is installed and accessible")

if __name__ == "__main__":
    main() 