import React, { useState, useEffect } from 'react';
import { dataSourceApi } from '../services/api';
import type { DataSource, QueryResult, DashboardComponent } from '../types';
import './DataConnectionManager.scss';

interface DataConnectionManagerProps {
  isOpen: boolean;
  onClose?: () => void;
  onDataSourceSelect: (dataSource: DataSource, query: string, data: QueryResult) => void;
  selectedComponent?: DashboardComponent | null;
}

interface DataSourceFormData {
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite' | 'api';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  apiUrl?: string;
  apiKey?: string;
}

const DataConnectionManager: React.FC<DataConnectionManagerProps> = ({
  isOpen,
  onClose,
  onDataSourceSelect,
  selectedComponent,
}) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'query' | 'preview'>('sources');
  const [showNewSourceForm, setShowNewSourceForm] = useState(false);
  const [newSourceData, setNewSourceData] = useState<DataSourceFormData>({
    name: '',
    type: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadDataSources();
    }
  }, [isOpen]);

  const loadDataSources = async () => {
    try {
      setIsLoading(true);
      const sources = await dataSourceApi.getDataSources();
      setDataSources(sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据源失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataSourceSelect = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
    setActiveTab('query');
    setQuery('SELECT * FROM your_table LIMIT 10');
  };

  const executeQuery = async () => {
    if (!selectedDataSource || !query.trim()) {
      setError('请选择数据源并输入查询语句');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await dataSourceApi.executeQuery(selectedDataSource.id, query);
      setQueryResult(result);
      setActiveTab('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询执行失败');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (dataSource: DataSource) => {
    try {
      setIsLoading(true);
      await dataSourceApi.testConnection(dataSource.id);
      alert('连接测试成功！');
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDataSource = async () => {
    try {
      setIsLoading(true);
      // 这里需要实现创建数据源的API调用
      // const newSource = await dataSourceApi.createDataSource(newSourceData);
      // setDataSources([...dataSources, newSource]);
      setShowNewSourceForm(false);
      setNewSourceData({
        name: '',
        type: 'mysql',
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
      });
      await loadDataSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建数据源失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedDataSource && queryResult) {
      onDataSourceSelect(selectedDataSource, query, queryResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="data-connection-manager-overlay">
      <div className="data-connection-manager">
        <div className="data-connection-header">
          <div className="header-content">
            <h2>数据连接管理器</h2>
            {selectedComponent && (
              <div className="selected-component-info">
                <span>为组件绑定数据: {selectedComponent.type}</span>
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="data-connection-tabs">
          <button
            className={`tab ${activeTab === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveTab('sources')}
          >
            数据源
          </button>
          <button
            className={`tab ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
            disabled={!selectedDataSource}
          >
            查询编辑器
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={!queryResult}
          >
            数据预览
          </button>
        </div>

        <div className="data-connection-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="sources-tab">
              <div className="sources-header">
                <h3>数据源列表</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowNewSourceForm(true)}
                >
                  新建数据源
                </button>
              </div>

              {showNewSourceForm && (
                <div className="new-source-form">
                  <h4>新建数据源</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>名称</label>
                      <input
                        type="text"
                        value={newSourceData.name}
                        onChange={(e) => setNewSourceData({ ...newSourceData, name: e.target.value })}
                        placeholder="数据源名称"
                      />
                    </div>
                    <div className="form-group">
                      <label>类型</label>
                      <select
                        value={newSourceData.type}
                        onChange={(e) => setNewSourceData({ ...newSourceData, type: e.target.value as any })}
                      >
                        <option value="mysql">MySQL</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="api">API</option>
                      </select>
                    </div>
                    {newSourceData.type !== 'api' && (
                      <>
                        <div className="form-group">
                          <label>主机</label>
                          <input
                            type="text"
                            value={newSourceData.host}
                            onChange={(e) => setNewSourceData({ ...newSourceData, host: e.target.value })}
                            placeholder="localhost"
                          />
                        </div>
                        <div className="form-group">
                          <label>端口</label>
                          <input
                            type="number"
                            value={newSourceData.port}
                            onChange={(e) => setNewSourceData({ ...newSourceData, port: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>数据库</label>
                          <input
                            type="text"
                            value={newSourceData.database}
                            onChange={(e) => setNewSourceData({ ...newSourceData, database: e.target.value })}
                            placeholder="数据库名称"
                          />
                        </div>
                        <div className="form-group">
                          <label>用户名</label>
                          <input
                            type="text"
                            value={newSourceData.username}
                            onChange={(e) => setNewSourceData({ ...newSourceData, username: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>密码</label>
                          <input
                            type="password"
                            value={newSourceData.password}
                            onChange={(e) => setNewSourceData({ ...newSourceData, password: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {newSourceData.type === 'api' && (
                      <>
                        <div className="form-group">
                          <label>API URL</label>
                          <input
                            type="url"
                            value={newSourceData.apiUrl || ''}
                            onChange={(e) => setNewSourceData({ ...newSourceData, apiUrl: e.target.value })}
                            placeholder="https://api.example.com"
                          />
                        </div>
                        <div className="form-group">
                          <label>API Key</label>
                          <input
                            type="password"
                            value={newSourceData.apiKey || ''}
                            onChange={(e) => setNewSourceData({ ...newSourceData, apiKey: e.target.value })}
                            placeholder="API密钥"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowNewSourceForm(false)}
                    >
                      取消
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateDataSource}
                      disabled={isLoading}
                    >
                      {isLoading ? '创建中...' : '创建'}
                    </button>
                  </div>
                </div>
              )}

              <div className="sources-list">
                {isLoading && <div className="loading">加载中...</div>}
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className={`source-item ${selectedDataSource?.id === source.id ? 'selected' : ''}`}
                    onClick={() => handleDataSourceSelect(source)}
                  >
                    <div className="source-info">
                      <h4>{source.name}</h4>
                      <p>{source.type} - {source.host}:{source.port}/{source.database}</p>
                      <span className={`status ${source.status}`}>{source.status}</span>
                    </div>
                    <div className="source-actions">
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          testConnection(source);
                        }}
                      >
                        测试连接
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'query' && selectedDataSource && (
            <div className="query-tab">
              <div className="query-header">
                <h3>查询编辑器 - {selectedDataSource.name}</h3>
                <button
                  className="btn btn-primary"
                  onClick={executeQuery}
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? '执行中...' : '执行查询'}
                </button>
              </div>
              <div className="query-editor">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="输入SQL查询语句..."
                  rows={10}
                />
              </div>
              <div className="query-tips">
                <h4>查询提示：</h4>
                <ul>
                  <li>使用 LIMIT 限制返回的行数以提高性能</li>
                  <li>避免使用 SELECT * 查询大表</li>
                  <li>可以使用参数化查询，如 WHERE id = :id</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'preview' && queryResult && (
            <div className="preview-tab">
              <div className="preview-header">
                <h3>数据预览</h3>
                <div className="preview-info">
                  <span>共 {queryResult.rows.length} 行数据</span>
                  <span>执行时间: {queryResult.executionTime}ms</span>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      {queryResult.columns.map((column) => (
                        <th key={column.name}>
                          {column.name}
                          <span className="column-type">({column.type})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.slice(0, 100).map((row, index) => (
                      <tr key={index}>
                        {queryResult.columns.map((column) => (
                          <td key={column.name}>
                            {row[column.name]?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResult.rows.length > 100 && (
                  <div className="table-footer">
                    显示前100行，共{queryResult.rows.length}行数据
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="data-connection-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          {queryResult && (
            <button
              className="btn btn-primary"
              onClick={handleConfirmSelection}
            >
              确认选择
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataConnectionManager;