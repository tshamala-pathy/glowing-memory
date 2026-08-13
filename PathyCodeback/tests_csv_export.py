import csv
import io

from django.test import SimpleTestCase

from PathyCodeback.csv_export import get_brand_meta, write_branded_csv_header


class BrandedCsvExportTests(SimpleTestCase):
    def test_brand_meta_defaults(self):
        meta = get_brand_meta()
        self.assertIn('company_name', meta)
        self.assertIn('tagline', meta)
        self.assertTrue(meta['company_name'])

    def test_branded_header_includes_company_and_title(self):
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        write_branded_csv_header(writer, 'Test Export', 'Test description.')
        lines = buffer.getvalue().splitlines()
        self.assertGreaterEqual(len(lines), 5)
        self.assertTrue(lines[0].startswith('Company,'))
        self.assertIn('PathyCode', lines[0])
        self.assertIn('Test Export', lines[2])
        self.assertIn('Test description.', lines[3])
        self.assertTrue(lines[4].startswith('Generated,'))
