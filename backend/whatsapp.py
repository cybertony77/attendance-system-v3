import sys
import json
import argparse
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import time
import urllib.parse
import platform

# Fix Unicode encoding issues on Windows
if sys.platform.startswith('win'):
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# ------------ Configuration ------------
import os
import platform

# Get the current user's home directory
if platform.system() == "Windows":
    home_dir = os.path.expanduser("~")
    CHROME_PROFILE_DIR = os.path.join(home_dir, "Desktop", "selenium_profile")
else:
    home_dir = os.path.expanduser("~")
    CHROME_PROFILE_DIR = os.path.join(home_dir, "selenium_profile")

# Create the directory if it doesn't exist
os.makedirs(CHROME_PROFILE_DIR, exist_ok=True)

WAIT_TIMEOUT = 30
CHAT_LOAD_TIMEOUT = 15

def setup_driver(quiet=False):
    """Setup Chrome driver with options"""
    try:
        options = webdriver.ChromeOptions()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--remote-debugging-port=9222")
        options.add_argument("--log-level=3")  # Suppress console logs
        options.add_argument(f"--user-data-dir={CHROME_PROFILE_DIR}")
        # Add additional options for better compatibility
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        # options.add_argument("--disable-images")  # REMOVED: Images needed for WhatsApp Web
        options.add_argument("--start-maximized")  # Start with maximized window
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Windows-specific options
        if platform.system() == "Windows":
            options.add_argument("--disable-web-security")
            options.add_argument("--allow-running-insecure-content")
            options.add_argument("--disable-features=VizDisplayCompositor")
        
        if not quiet:
            print(f"[INFO] Using Chrome profile directory: {CHROME_PROFILE_DIR}")
        
        # Try to use Chrome with specific path - REMOVED HEADLESS MODE
        chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        options.binary_location = chrome_path
        # options.add_argument("--headless")  # REMOVED: Headless mode prevents WhatsApp Web from working
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        options.add_argument("--disable-background-timer-throttling")
        options.add_argument("--disable-backgrounding-occluded-windows")
        options.add_argument("--disable-renderer-backgrounding")
        
        try:
            # Try without ChromeDriver first
            driver = webdriver.Chrome(options=options)
            if not quiet:
                print(f"[INFO] Chrome driver initialized successfully with path: {chrome_path}")
        except Exception as e:
            if not quiet:
                print(f"[WARNING] Chrome initialization failed: {e}")
                print("[INFO] Trying with ChromeDriverManager...")
            
            # Fallback to ChromeDriverManager only if needed
            try:
                from webdriver_manager.chrome import ChromeDriverManager
                driver_path = ChromeDriverManager().install()
                if not quiet:
                    print(f"[INFO] Chrome driver installed at: {driver_path}")
                service = Service(driver_path)
                driver = webdriver.Chrome(service=service, options=options)
            except Exception as e2:
                if not quiet:
                    print(f"[ERROR] ChromeDriverManager also failed: {e2}")
                raise e2
        
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return driver
    except Exception as e:
        if not quiet:
            print(f"[ERROR] Failed to setup Chrome driver: {str(e)}")
            print(f"[INFO] Chrome profile directory: {CHROME_PROFILE_DIR}")
            print(f"[INFO] Please ensure Chrome is installed and accessible")
            print(f"[INFO] Try running: pip install --upgrade webdriver-manager")
        raise e

def wait_for_element(driver, by, value, timeout=WAIT_TIMEOUT):
    """Wait for element to be present and clickable"""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        return element
    except TimeoutException:
        return None

def send_whatsapp_message(phone_number, message, driver=None, quiet=False):
    """
    Send WhatsApp message to a single phone number
    
    Args:
        phone_number (str): Phone number with country code (e.g., +201234567890)
        message (str): Message content to send
        driver: Optional existing WebDriver instance
        quiet (bool): Suppress status messages if True
    
    Returns:
        dict: Result with success status and message
    """
    should_close_driver = False
    if driver is None:
        driver = setup_driver(quiet=quiet)
        should_close_driver = True
    
    try:
        # Format phone number (remove + if present, ensure proper format)
        formatted_number = phone_number.replace('+', '').replace(' ', '').replace('-', '')
        
        # Encode message for URL
        encoded_message = urllib.parse.quote(message)
        
        # Construct WhatsApp Web URL
        url = f"https://web.whatsapp.com/send?phone={formatted_number}&text={encoded_message}"
        
        if not quiet:
            print(f"[SENDING] Sending to {phone_number}...")
        driver.get(url)
        
        # Wait for chat to load and check for WhatsApp Web authentication
        time.sleep(8)  # Increased wait time for WhatsApp Web to load
        
        # Check if WhatsApp Web is authenticated
        try:
            # Look for QR code (not authenticated)
            qr_code = driver.find_elements(By.XPATH, "//div[@data-testid='qrcode']")
            if qr_code:
                result = {
                    "success": False,
                    "error": "WhatsApp Web not authenticated. Please scan QR code first."
                }
                return result
        except:
            pass
        
        # Wait for the send button to be available (multiple possible selectors)
        send_button = None
        selectors = [
            '//div[@contenteditable="true"][@data-tab="10"]',
            '//div[@contenteditable="true"][@data-tab="6"]',
            '//div[@contenteditable="true"]',
            '//span[@data-testid="send"]',
            '//button[@data-testid="send"]'
        ]
        
        for selector in selectors:
            send_button = wait_for_element(driver, By.XPATH, selector, 10)
            if send_button:
                break
        
        if send_button is None:
            # Try to find any clickable send element
            try:
                send_button = driver.find_element(By.XPATH, "//span[@data-testid='send']")
            except:
                try:
                    send_button = driver.find_element(By.XPATH, "//button[@data-testid='send']")
                except:
                    pass
        
        if send_button is None:
            result = {
                "success": False,
                "error": "Could not find send button. WhatsApp Web may not be loaded properly."
            }
        else:
            # Send the message
            try:
                send_button.send_keys(Keys.ENTER)
                time.sleep(3)  # Wait for message to be sent
            except:
                # Try clicking instead of sending keys
                try:
                    send_button.click()
                    time.sleep(3)
                except Exception as click_error:
                    result = {
                        "success": False,
                        "error": f"Failed to send message: {str(click_error)}"
                    }
                    return result
            
            if not quiet:
                print(f"[SUCCESS] Successfully sent to {phone_number}")
            result = {
                "success": True,
                "message": f"Message sent successfully to {phone_number}"
            }
        
    except Exception as e:
        error_msg = f"Failed to send to {phone_number}: {str(e)}"
        if not quiet:
            print(f"[ERROR] {error_msg}")
        result = {
            "success": False,
            "error": error_msg
        }
    
    finally:
        if should_close_driver:
            try:
                driver.quit()
            except Exception as quit_error:
                if not quiet:
                    print(f"[WARNING] Error closing driver: {str(quit_error)}")
    
    # Only return the result, don't print anything in quiet mode
    return result

def send_bulk_messages(phone_numbers, message, driver=None, quiet=False):
    """
    Send WhatsApp message to multiple phone numbers
    
    Args:
        phone_numbers (list): List of phone numbers
        message (str): Message content to send
        driver: Optional existing WebDriver instance
        quiet (bool): Suppress status messages if True
    
    Returns:
        dict: Results for all messages
    """
    should_close_driver = False
    if driver is None:
        driver = setup_driver(quiet=quiet)
        should_close_driver = True
    
    results = []
    
    try:
        for i, number in enumerate(phone_numbers):
            result = send_whatsapp_message(number, message, driver, quiet)
            results.append({
                "phone_number": number,
                "success": result["success"],
                "message": result.get("message", ""),
                "error": result.get("error", "")
            })
            
            # Add delay between messages to avoid rate limiting
            if i < len(phone_numbers) - 1:
                time.sleep(3)
                
    finally:
        if should_close_driver:
            try:
                driver.quit()
            except Exception as quit_error:
                if not quiet:
                    print(f"[WARNING] Error closing driver: {str(quit_error)}")
    
    return results

def setup_whatsapp_web(quiet=False):
    """
    Open WhatsApp Web for initial setup and authentication
    This function opens WhatsApp Web so you can scan the QR code
    """
    driver = setup_driver(quiet=quiet)
    try:
        driver.get("https://web.whatsapp.com")
        if not quiet:
            print("[SETUP] WhatsApp Web opened. Please scan the QR code to authenticate.")
            print("[SETUP] Keep this browser window open for future message sending.")
        return driver
    except Exception as e:
        if not quiet:
            print(f"[ERROR] Failed to open WhatsApp Web: {str(e)}")
        driver.quit()
        raise e

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description='Send WhatsApp messages via Selenium')
    parser.add_argument('--phone', type=str, help='Phone number to send message to')
    parser.add_argument('--message', type=str, help='Message content to send')
    parser.add_argument('--phones', type=str, help='JSON array of phone numbers for bulk sending')
    parser.add_argument('--bulk-message', type=str, help='Message for bulk sending')
    parser.add_argument('--quiet', action='store_true', help='Suppress status messages (for Node.js integration)')
    parser.add_argument('--setup', action='store_true', help='Open WhatsApp Web for initial setup')
    
    args = parser.parse_args()
    
    # Handle setup mode
    if args.setup:
        try:
            driver = setup_whatsapp_web(quiet=args.quiet)
            if not args.quiet:
                print("[SETUP] WhatsApp Web setup completed. You can now close this window.")
            # Keep the driver running for setup
            input("Press Enter to close the browser...")
            driver.quit()
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Setup failed: {str(e)}"}))
        return
    
    # Handle single message
    if args.phone and args.message:
        result = send_whatsapp_message(args.phone, args.message, quiet=args.quiet)
        print(json.dumps(result))
        return
    
    # Handle bulk messages
    if args.phones and args.bulk_message:
        try:
            phone_numbers = json.loads(args.phones)
            results = send_bulk_messages(phone_numbers, args.bulk_message, quiet=args.quiet)
            print(json.dumps(results))
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid JSON format for phone numbers"}))
        return
    
    # If no valid arguments, show usage
    print(json.dumps({"success": False, "error": "Invalid arguments. Use --help for usage information"}))

if __name__ == "__main__":
    main()
