import unittest
import json
from service import app, topological_sort

class TestAIService(unittest.TestCase):

    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_topological_sort(self):
        # Table A has field referencing Table B
        # Table B has no foreign keys
        tables = [
            {
                "id": "table_a",
                "name": "Users",
                "fields": [
                    {
                        "name": "role_id",
                        "isForeignKey": True,
                        "referencesTable": "table_b",
                        "referencesField": "id"
                    }
                ]
            },
            {
                "id": "table_b",
                "name": "Roles",
                "fields": []
            }
        ]
        sorted_tables = topological_sort(tables)
        # Roles should come before Users (table_b before table_a)
        sorted_ids = [t['id'] for t in sorted_tables]
        self.assertEqual(sorted_ids, ["table_b", "table_a"])

    def test_health_route(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('MockForge Python Generator', data['service'])

    def test_preview_route(self):
        payload = {
            "tables": [
                {
                    "id": "table_1",
                    "name": "Products",
                    "rowsCount": 5,
                    "fields": [
                        {"name": "id", "type": "UUID", "isPrimaryKey": True},
                        {"name": "name", "type": "Name"},
                        {"name": "price", "type": "Decimal", "constraints": {"min": 10, "max": 100}}
                    ]
                }
            ]
        }
        response = self.client.post('/preview', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('preview', data)
        self.assertIn('Products', data['preview'])
        products = data['preview']['Products']
        self.assertEqual(len(products), 5)
        for prod in products:
            self.assertIn('id', prod)
            self.assertIn('name', prod)
            self.assertIn('price', prod)

    def test_generate_route(self):
        payload = {
            "jobId": "test-job-123",
            "tables": [
                {
                    "id": "table_1",
                    "name": "Users",
                    "rowsCount": 15,
                    "fields": [
                        {"name": "id", "type": "UUID", "isPrimaryKey": True},
                        {"name": "email", "type": "Email"}
                    ]
                }
            ]
        }
        response = self.client.post('/generate', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['jobId'], 'test-job-123')
        self.assertEqual(data['status'], 'completed')
        self.assertEqual(data['tablesGenerated'], 1)
        self.assertEqual(data['totalRows'], 15)
        self.assertIn('downloadPath', data)

    def test_generate_with_fk(self):
        payload = {
            "jobId": "test-job-fk",
            "tables": [
                {
                    "id": "table_parent",
                    "name": "Parents",
                    "rowsCount": 5,
                    "fields": [
                        {"name": "id", "type": "UUID", "isPrimaryKey": True}
                    ]
                },
                {
                    "id": "table_child",
                    "name": "Children",
                    "rowsCount": 10,
                    "fields": [
                        {"name": "id", "type": "UUID", "isPrimaryKey": True},
                        {"name": "parent_id", "isForeignKey": True, "referencesTable": "table_parent", "referencesField": "id"}
                    ]
                }
            ]
        }
        response = self.client.post('/preview', 
                                    data=json.dumps(payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('preview', data)
        self.assertIn('Parents', data['preview'])
        self.assertIn('Children', data['preview'])
        
        parents = data['preview']['Parents']
        children = data['preview']['Children']
        
        parent_ids = [p['id'] for p in parents]
        for child in children:
            self.assertIn(child['parent_id'], parent_ids)
            self.assertNotIsInstance(child['parent_id'], dict)

if __name__ == '__main__':
    unittest.main()
