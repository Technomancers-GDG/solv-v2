from __future__ import annotations

from pathlib import Path
from typing import Any

import gspread
from google.auth.exceptions import DefaultCredentialsError
from google.oauth2.service_account import Credentials

from config import settings


class GoogleSheetsReader:
    """Read tabular data from Google Sheets using gspread.

    Expects the same row/column layout as the legacy WorkbookXmlReader so
    event_ingestion.py can swap readers with minimal changes.
    """

    def __init__(
        self,
        sheet_id: str,
        credentials_path: str | None = None,
    ) -> None:
        self.sheet_id = sheet_id
        self.credentials_path = credentials_path or getattr(
            settings, "google_sheets_credentials_path", None
        )
        self._client: gspread.Client | None = None
        self._spreadsheet: gspread.Spreadsheet | None = None

    def _get_client(self) -> gspread.Client:
        if self._client is not None:
            return self._client

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
        ]

        if self.credentials_path and Path(self.credentials_path).exists():
            creds = Credentials.from_service_account_file(
                self.credentials_path, scopes=scopes
            )
        else:
            # Fall back to application-default credentials (GCE, Cloud Run, etc.)
            try:
                creds = Credentials.default(scopes=scopes)
            except DefaultCredentialsError as exc:
                raise RuntimeError(
                    "Google Sheets credentials not found. "
                    "Set GOOGLE_SHEETS_CREDENTIALS_PATH to a service-account JSON file, "
                    "or ensure Application Default Credentials are configured."
                ) from exc

        self._client = gspread.authorize(creds)
        return self._client

    def _get_spreadsheet(self) -> gspread.Spreadsheet:
        if self._spreadsheet is not None:
            return self._spreadsheet
        client = self._get_client()
        self._spreadsheet = client.open_by_key(self.sheet_id)
        return self._spreadsheet

    def sheet_names(self) -> list[str]:
        spreadsheet = self._get_spreadsheet()
        return [ws.title for ws in spreadsheet.worksheets()]

    def iter_sheet_rows(self, sheet_name: str) -> list[dict[str, str | None]]:
        spreadsheet = self._get_spreadsheet()
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.WorksheetNotFound:
            return []

        # Get all values as list of lists (first row = headers)
        all_values = worksheet.get_all_values()
        if not all_values:
            return []

        headers = [str(h).strip() if h else None for h in all_values[0]]
        output: list[dict[str, str | None]] = []

        for row in all_values[1:]:
            row_dict: dict[str, str | None] = {}
            for idx, header in enumerate(headers):
                if header is None:
                    continue
                value = row[idx] if idx < len(row) else None
                row_dict[header] = str(value).strip() if value is not None else None
            output.append(row_dict)

        return output


def get_news_reader() -> GoogleSheetsReader | None:
    sheet_id = getattr(settings, "news_sheet_id", None)
    if not sheet_id:
        return None
    return GoogleSheetsReader(
        sheet_id=sheet_id,
        credentials_path=getattr(settings, "google_sheets_credentials_path", None),
    )


def get_weather_reader() -> GoogleSheetsReader | None:
    sheet_id = getattr(settings, "weather_sheet_id", None)
    if not sheet_id:
        return None
    return GoogleSheetsReader(
        sheet_id=sheet_id,
        credentials_path=getattr(settings, "google_sheets_credentials_path", None),
    )
