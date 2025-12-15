#!/usr/bin/env python3
"""
IPTV Management System - Backend API Testing
Tests all API endpoints for authentication, CRUD operations, and data validation
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class IPTVAPITester:
    def __init__(self, base_url="https://stream-control-16.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_dns_id = None
        self.created_user_id = None
        self.created_payment_id = None

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        
        if response_data:
            result["response_sample"] = str(response_data)[:200] + "..." if len(str(response_data)) > 200 else str(response_data)
            
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    # ==================== AUTHENTICATION TESTS ====================
    
    def test_admin_register(self):
        """Test admin registration"""
        test_email = f"test_admin_{datetime.now().strftime('%H%M%S')}@iptv.com"
        data = {
            "email": test_email,
            "name": "Test Admin",
            "password": "testpass123"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', data, 200)
        
        if success and 'access_token' in response:
            self.log_result("Admin Registration", True, f"Created admin: {test_email}")
            return True
        else:
            self.log_result("Admin Registration", False, f"Status: {status}", response)
            return False

    def test_admin_login(self):
        """Test admin login with existing credentials"""
        data = {
            "email": "admin@iptv.com",
            "password": "admin123"
        }
        
        success, response, status = self.make_request('POST', 'auth/login', data, 200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_result("Admin Login", True, "Successfully authenticated")
            return True
        else:
            self.log_result("Admin Login", False, f"Status: {status}", response)
            return False

    def test_get_current_admin(self):
        """Test getting current admin info"""
        if not self.token:
            self.log_result("Get Current Admin", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'auth/me', expected_status=200)
        
        if success and 'email' in response:
            self.log_result("Get Current Admin", True, f"Admin: {response.get('email')}")
            return True
        else:
            self.log_result("Get Current Admin", False, f"Status: {status}", response)
            return False

    # ==================== DNS TESTS ====================
    
    def test_create_dns(self):
        """Test DNS server creation"""
        if not self.token:
            self.log_result("Create DNS", False, "No authentication token")
            return False
            
        data = {
            "title": f"Test Server {datetime.now().strftime('%H%M%S')}",
            "url": "http://test-server.iptv",
            "active": True
        }
        
        success, response, status = self.make_request('POST', 'dns', data, 200)
        
        if success and 'id' in response:
            self.created_dns_id = response['id']
            self.log_result("Create DNS", True, f"Created DNS: {response['title']}")
            return True
        else:
            self.log_result("Create DNS", False, f"Status: {status}", response)
            return False

    def test_get_dns_list(self):
        """Test getting DNS servers list"""
        if not self.token:
            self.log_result("Get DNS List", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'dns', expected_status=200)
        
        if success and isinstance(response, list):
            self.log_result("Get DNS List", True, f"Found {len(response)} DNS servers")
            return True
        else:
            self.log_result("Get DNS List", False, f"Status: {status}", response)
            return False

    def test_update_dns(self):
        """Test DNS server update"""
        if not self.token or not self.created_dns_id:
            self.log_result("Update DNS", False, "No token or DNS ID")
            return False
            
        data = {
            "title": "Updated Test Server",
            "active": False
        }
        
        success, response, status = self.make_request('PUT', f'dns/{self.created_dns_id}', data, 200)
        
        if success and response.get('title') == "Updated Test Server":
            self.log_result("Update DNS", True, "DNS updated successfully")
            return True
        else:
            self.log_result("Update DNS", False, f"Status: {status}", response)
            return False

    # ==================== USER TESTS ====================
    
    def test_create_user(self):
        """Test IPTV user creation"""
        if not self.token or not self.created_dns_id:
            self.log_result("Create User", False, "No token or DNS ID")
            return False
            
        expire_date = (datetime.now() + timedelta(days=30)).isoformat()
        data = {
            "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
            "password": "testpass123",
            "dns_id": self.created_dns_id,
            "mac_address": "00:11:22:33:44:55",
            "expire_date": expire_date,
            "pin": "1234"
        }
        
        success, response, status = self.make_request('POST', 'users', data, 200)
        
        if success and 'id' in response:
            self.created_user_id = response['id']
            self.log_result("Create User", True, f"Created user: {response['username']}")
            return True
        else:
            self.log_result("Create User", False, f"Status: {status}", response)
            return False

    def test_get_users_list(self):
        """Test getting users list"""
        if not self.token:
            self.log_result("Get Users List", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'users', expected_status=200)
        
        if success and isinstance(response, list):
            self.log_result("Get Users List", True, f"Found {len(response)} users")
            return True
        else:
            self.log_result("Get Users List", False, f"Status: {status}", response)
            return False

    def test_update_user(self):
        """Test user update"""
        if not self.token or not self.created_user_id:
            self.log_result("Update User", False, "No token or user ID")
            return False
            
        data = {
            "pin": "9999",
            "active": True
        }
        
        success, response, status = self.make_request('PUT', f'users/{self.created_user_id}', data, 200)
        
        if success and response.get('pin') == "9999":
            self.log_result("Update User", True, "User updated successfully")
            return True
        else:
            self.log_result("Update User", False, f"Status: {status}", response)
            return False

    def test_validate_m3u(self):
        """Test M3U validation"""
        if not self.token or not self.created_user_id:
            self.log_result("Validate M3U", False, "No token or user ID")
            return False
            
        success, response, status = self.make_request('POST', f'users/{self.created_user_id}/validate', expected_status=200)
        
        if success and 'valid' in response:
            result = "Valid" if response['valid'] else "Invalid"
            self.log_result("Validate M3U", True, f"M3U validation: {result}")
            return True
        else:
            self.log_result("Validate M3U", False, f"Status: {status}", response)
            return False

    # ==================== PAYMENT TESTS ====================
    
    def test_create_payment(self):
        """Test payment creation"""
        if not self.token or not self.created_user_id:
            self.log_result("Create Payment", False, "No token or user ID")
            return False
            
        data = {
            "user_id": self.created_user_id,
            "amount": 50.00,
            "status": "completed",
            "method": "pix",
            "notes": "Test payment"
        }
        
        success, response, status = self.make_request('POST', 'payments', data, 200)
        
        if success and 'id' in response:
            self.created_payment_id = response['id']
            self.log_result("Create Payment", True, f"Created payment: R$ {response['amount']}")
            return True
        else:
            self.log_result("Create Payment", False, f"Status: {status}", response)
            return False

    def test_get_payments_list(self):
        """Test getting payments list"""
        if not self.token:
            self.log_result("Get Payments List", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'payments', expected_status=200)
        
        if success and isinstance(response, list):
            self.log_result("Get Payments List", True, f"Found {len(response)} payments")
            return True
        else:
            self.log_result("Get Payments List", False, f"Status: {status}", response)
            return False

    # ==================== SETTINGS TESTS ====================
    
    def test_get_settings(self):
        """Test getting system settings"""
        if not self.token:
            self.log_result("Get Settings", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'settings', expected_status=200)
        
        if success and 'id' in response:
            self.log_result("Get Settings", True, "Settings retrieved successfully")
            return True
        else:
            self.log_result("Get Settings", False, f"Status: {status}", response)
            return False

    def test_update_settings(self):
        """Test updating system settings"""
        if not self.token:
            self.log_result("Update Settings", False, "No authentication token")
            return False
            
        data = {
            "whatsapp_support": "+55 11 99999-9999",
            "welcome_message": "Bem-vindo ao nosso serviço IPTV de teste!"
        }
        
        success, response, status = self.make_request('PUT', 'settings', data, 200)
        
        if success and response.get('whatsapp_support') == data['whatsapp_support']:
            self.log_result("Update Settings", True, "Settings updated successfully")
            return True
        else:
            self.log_result("Update Settings", False, f"Status: {status}", response)
            return False

    # ==================== STATS TESTS ====================
    
    def test_get_stats(self):
        """Test getting dashboard statistics"""
        if not self.token:
            self.log_result("Get Stats", False, "No authentication token")
            return False
            
        success, response, status = self.make_request('GET', 'stats', expected_status=200)
        
        if success and 'total_users' in response:
            stats = f"Users: {response['total_users']}, Revenue: R$ {response.get('total_revenue', 0)}"
            self.log_result("Get Stats", True, f"Stats: {stats}")
            return True
        else:
            self.log_result("Get Stats", False, f"Status: {status}", response)
            return False

    # ==================== PUBLIC PORTAL TESTS ====================
    
    def test_public_portal(self):
        """Test public user portal (no auth required)"""
        if not self.created_user_id:
            # Try with existing test user
            username = "cliente1"
        else:
            # Get username from created user
            success, user_data, _ = self.make_request('GET', 'users')
            if success and isinstance(user_data, list) and len(user_data) > 0:
                username = user_data[0]['username']
            else:
                self.log_result("Public Portal", False, "No users available for testing")
                return False
        
        # Test without auth token
        temp_token = self.token
        self.token = None
        
        success, response, status = self.make_request('GET', f'portal/{username}', expected_status=200)
        
        # Restore token
        self.token = temp_token
        
        if success and 'user' in response:
            self.log_result("Public Portal", True, f"Portal accessible for user: {username}")
            return True
        else:
            self.log_result("Public Portal", False, f"Status: {status}", response)
            return False

    # ==================== CLEANUP TESTS ====================
    
    def cleanup_test_data(self):
        """Clean up created test data"""
        cleanup_results = []
        
        # Delete payment
        if self.created_payment_id:
            success, _, _ = self.make_request('DELETE', f'payments/{self.created_payment_id}', expected_status=200)
            cleanup_results.append(f"Payment: {'✅' if success else '❌'}")
        
        # Delete user
        if self.created_user_id:
            success, _, _ = self.make_request('DELETE', f'users/{self.created_user_id}', expected_status=200)
            cleanup_results.append(f"User: {'✅' if success else '❌'}")
        
        # Delete DNS
        if self.created_dns_id:
            success, _, _ = self.make_request('DELETE', f'dns/{self.created_dns_id}', expected_status=200)
            cleanup_results.append(f"DNS: {'✅' if success else '❌'}")
        
        if cleanup_results:
            self.log_result("Cleanup", True, f"Cleanup results: {', '.join(cleanup_results)}")

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting IPTV Management System API Tests")
        print(f"📡 Testing API: {self.api_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_admin_register()
        auth_success = self.test_admin_login()
        
        if not auth_success:
            print("❌ Authentication failed - stopping tests")
            return self.generate_report()
        
        self.test_get_current_admin()
        
        # DNS Tests
        print("\n🌐 DNS SERVER TESTS")
        self.test_create_dns()
        self.test_get_dns_list()
        self.test_update_dns()
        
        # User Tests
        print("\n👥 USER MANAGEMENT TESTS")
        self.test_create_user()
        self.test_get_users_list()
        self.test_update_user()
        self.test_validate_m3u()
        
        # Payment Tests
        print("\n💰 PAYMENT TESTS")
        self.test_create_payment()
        self.test_get_payments_list()
        
        # Settings Tests
        print("\n⚙️ SETTINGS TESTS")
        self.test_get_settings()
        self.test_update_settings()
        
        # Stats Tests
        print("\n📊 STATISTICS TESTS")
        self.test_get_stats()
        
        # Public Portal Tests
        print("\n🌍 PUBLIC PORTAL TESTS")
        self.test_public_portal()
        
        # Cleanup
        print("\n🧹 CLEANUP")
        self.cleanup_test_data()
        
        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = IPTVAPITester()
    report = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if report['success_rate'] >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())