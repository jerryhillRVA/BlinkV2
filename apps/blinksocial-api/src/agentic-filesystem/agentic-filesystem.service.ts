import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FileUploadResult {
  file_id: string;
  filename: string;
}

export interface DirEntry {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  file_id?: string;
  size_bytes?: number;
  mime_type?: string;
}

export interface BatchFileEntry {
  file_id: string;
  filename: string;
  content_type: 'text' | 'json' | 'binary' | 'error';
  content?: unknown;
  error?: string;
}

@Injectable()
export class AgenticFilesystemService {
  private readonly logger = new Logger(AgenticFilesystemService.name);
  private readonly baseUrl: string | undefined;

  constructor() {
    this.baseUrl = process.env['AGENTIC_FS_URL'];
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  async uploadJsonFile(
    tenant: string,
    namespace: string,
    filename: string,
    content: unknown,
    tags?: string[]
  ): Promise<FileUploadResult> {
    const url = `${this.baseUrl}/v1/${tenant}/files`;
    const jsonStr = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('namespace', namespace);
    formData.append('path', '');
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    const response = await axios.post(url, formData);
    return response.data;
  }

  async uploadTextFile(
    tenant: string,
    namespace: string,
    filename: string,
    content: string,
    tags?: string[]
  ): Promise<FileUploadResult> {
    const url = `${this.baseUrl}/v1/${tenant}/files`;
    const blob = new Blob([content], { type: 'text/markdown' });

    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('namespace', namespace);
    formData.append('path', '');
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    const response = await axios.post(url, formData);
    return response.data;
  }

  async replaceJsonFile(
    tenant: string,
    fileId: string,
    filename: string,
    content: unknown
  ): Promise<FileUploadResult> {
    const url = `${this.baseUrl}/v1/${tenant}/files/${fileId}`;
    const jsonStr = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', blob, filename);

    const response = await axios.put(url, formData);
    return response.data;
  }

  async batchRetrieve(
    tenant: string,
    fileIds: string[]
  ): Promise<BatchFileEntry[]> {
    const url = `${this.baseUrl}/v1/${tenant}/files/batch`;
    const response = await axios.post(url, {
      file_ids: fileIds,
      include_content: true,
    });
    return response.data.files;
  }

  async listDirectory(
    tenant: string,
    namespace: string,
    path = ''
  ): Promise<DirEntry[]> {
    const url = path
      ? `${this.baseUrl}/v1/${tenant}/dirs/${path}`
      : `${this.baseUrl}/v1/${tenant}/dirs`;
    const response = await axios.get(url, {
      params: { namespace },
    });
    return response.data.entries;
  }

  async deleteFile(tenant: string, fileId: string): Promise<void> {
    const url = `${this.baseUrl}/v1/${tenant}/files/${fileId}`;
    await axios.delete(url);
  }

  async listTenants(): Promise<string[]> {
    const response = await axios.get(`${this.baseUrl}/admin/tenants`);
    return response.data.tenants;
  }
}
