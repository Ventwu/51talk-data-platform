import axios from 'axios';
import { AppError } from '../../middleware/errorHandler';

/**
 * 飞书消息格式
 */
interface FeishuMessage {
  msg_type: 'text' | 'rich_text' | 'interactive';
  content: {
    text?: string;
    rich_text?: any;
    card?: any;
  };
}

/**
 * 企业微信消息格式
 */
interface WechatMessage {
  msgtype: 'text' | 'markdown' | 'image' | 'news';
  text?: {
    content: string;
    mentioned_list?: string[];
    mentioned_mobile_list?: string[];
  };
  markdown?: {
    content: string;
  };
}

/**
 * 邮件配置
 */
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * 通知服务
 * 支持飞书、企业微信、邮件等多种推送方式
 */
export class NotificationService {
  private emailConfig?: EmailConfig;

  constructor() {
    this.initializeEmailConfig();
  }

  /**
   * 初始化邮件配置
   */
  private initializeEmailConfig(): void {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (host && port && user && pass) {
      this.emailConfig = {
        host,
        port: parseInt(port),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user, pass }
      };
    }
  }

  /**
   * 发送飞书消息
   * @param webhookUrl 飞书机器人webhook地址
   * @param title 消息标题
   * @param content 消息内容
   * @param messageType 消息类型
   */
  async sendFeishuMessage(
    webhookUrl: string,
    title: string,
    content: string,
    messageType: 'text' | 'rich_text' | 'card' = 'text'
  ): Promise<void> {
    try {
      let message: FeishuMessage;

      switch (messageType) {
        case 'text':
          message = {
            msg_type: 'text',
            content: {
              text: `${title}\n\n${content}`
            }
          };
          break;

        case 'rich_text':
          message = {
            msg_type: 'rich_text',
            content: {
              rich_text: {
                elements: [
                  {
                    tag: 'text',
                    text: title,
                    style: {
                      bold: true
                    }
                  },
                  {
                    tag: 'text',
                    text: `\n\n${content}`
                  }
                ]
              }
            }
          };
          break;

        case 'card':
          message = {
            msg_type: 'interactive',
            content: {
              card: {
                config: {
                  wide_screen_mode: true
                },
                header: {
                  title: {
                    tag: 'plain_text',
                    content: title
                  },
                  template: 'blue'
                },
                elements: [
                  {
                    tag: 'div',
                    text: {
                      tag: 'plain_text',
                      content: content
                    }
                  },
                  {
                    tag: 'hr'
                  },
                  {
                    tag: 'note',
                    elements: [
                      {
                        tag: 'plain_text',
                        content: `发送时间: ${new Date().toLocaleString('zh-CN')}`
                      }
                    ]
                  }
                ]
              }
            }
          };
          break;
      }

      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.code !== 0) {
        throw new Error(`飞书消息发送失败: ${response.data.msg}`);
      }

      console.log('飞书消息发送成功');
    } catch (error) {
      console.error('发送飞书消息失败:', error);
      throw new AppError(`发送飞书消息失败: ${error}`, 500);
    }
  }

  /**
   * 发送企业微信消息
   * @param webhookUrl 企业微信机器人webhook地址
   * @param title 消息标题
   * @param content 消息内容
   * @param messageType 消息类型
   * @param mentionedList 提醒用户列表
   */
  async sendWechatMessage(
    webhookUrl: string,
    title: string,
    content: string,
    messageType: 'text' | 'markdown' = 'text',
    mentionedList?: string[]
  ): Promise<void> {
    try {
      let message: WechatMessage;

      switch (messageType) {
        case 'text':
          message = {
            msgtype: 'text',
            text: {
              content: `${title}\n\n${content}`,
              mentioned_list: mentionedList
            }
          };
          break;

        case 'markdown':
          const markdownContent = `## ${title}\n\n${content}\n\n---\n\n*发送时间: ${new Date().toLocaleString('zh-CN')}*`;
          message = {
            msgtype: 'markdown',
            markdown: {
              content: markdownContent
            }
          };
          break;
      }

      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.errcode !== 0) {
        throw new Error(`企业微信消息发送失败: ${response.data.errmsg}`);
      }

      console.log('企业微信消息发送成功');
    } catch (error) {
      console.error('发送企业微信消息失败:', error);
      throw new AppError(`发送企业微信消息失败: ${error}`, 500);
    }
  }

  /**
   * 发送邮件
   * @param recipients 收件人列表
   * @param subject 邮件主题
   * @param content 邮件内容
   * @param isHtml 是否为HTML格式
   */
  async sendEmail(
    recipients: string[],
    subject: string,
    content: string,
    isHtml: boolean = false
  ): Promise<void> {
    if (!this.emailConfig) {
      throw new AppError('邮件服务未配置', 500);
    }

    try {
      // 这里使用nodemailer发送邮件
      // 由于需要额外的依赖，这里只是示例代码
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter(this.emailConfig);

      const mailOptions = {
        from: this.emailConfig.auth.user,
        to: recipients.join(','),
        subject: subject,
        [isHtml ? 'html' : 'text']: content
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('邮件发送成功:', info.messageId);
    } catch (error) {
      console.error('发送邮件失败:', error);
      throw new AppError(`发送邮件失败: ${error}`, 500);
    }
  }

  /**
   * 发送数据报告
   * @param type 推送类型
   * @param config 推送配置
   * @param data 数据内容
   */
  async sendDataReport(
    type: 'feishu' | 'wechat' | 'email',
    config: {
      webhookUrl?: string;
      recipients?: string[];
      title: string;
      template?: string;
    },
    data: any[]
  ): Promise<void> {
    const { title, template, webhookUrl, recipients } = config;
    
    // 格式化数据内容
    const content = this.formatDataReport(data, template);

    switch (type) {
      case 'feishu':
        if (!webhookUrl) {
          throw new AppError('飞书推送需要webhook地址', 400);
        }
        await this.sendFeishuMessage(webhookUrl, title, content, 'card');
        break;

      case 'wechat':
        if (!webhookUrl) {
          throw new AppError('企业微信推送需要webhook地址', 400);
        }
        await this.sendWechatMessage(webhookUrl, title, content, 'markdown');
        break;

      case 'email':
        if (!recipients || recipients.length === 0) {
          throw new AppError('邮件推送需要收件人地址', 400);
        }
        await this.sendEmail(recipients, title, content, true);
        break;

      default:
        throw new AppError(`不支持的推送类型: ${type}`, 400);
    }
  }

  /**
   * 格式化数据报告
   */
  private formatDataReport(data: any[], template?: string): string {
    if (template) {
      // 使用自定义模板
      let formatted = template;
      formatted = formatted.replace(/\{\{count\}\}/g, data.length.toString());
      formatted = formatted.replace(/\{\{data\}\}/g, JSON.stringify(data, null, 2));
      formatted = formatted.replace(/\{\{time\}\}/g, new Date().toLocaleString('zh-CN'));
      return formatted;
    }

    // 默认格式
    if (data.length === 0) {
      return '📊 **数据报告**\n\n暂无数据';
    }

    const summary = `📊 **数据报告**\n\n📈 **数据概览**\n- 总记录数: ${data.length}\n- 生成时间: ${new Date().toLocaleString('zh-CN')}`;
    
    // 数据预览（前5条）
    const preview = data.slice(0, 5).map((row, index) => {
      const fields = Object.entries(row)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join('\n');
      return `**记录 ${index + 1}:**\n${fields}`;
    }).join('\n\n');

    const moreInfo = data.length > 5 ? `\n\n*还有 ${data.length - 5} 条记录未显示...*` : '';

    return `${summary}\n\n📋 **数据详情**\n\n${preview}${moreInfo}`;
  }

  /**
   * 测试推送配置
   */
  async testNotification(
    type: 'feishu' | 'wechat' | 'email',
    config: {
      webhookUrl?: string;
      recipients?: string[];
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const testTitle = '🔔 测试推送';
      const testContent = '这是一条测试消息，如果您收到此消息，说明推送配置正常。';

      switch (type) {
        case 'feishu':
          if (!config.webhookUrl) {
            return { success: false, message: '缺少webhook地址' };
          }
          await this.sendFeishuMessage(config.webhookUrl, testTitle, testContent);
          break;

        case 'wechat':
          if (!config.webhookUrl) {
            return { success: false, message: '缺少webhook地址' };
          }
          await this.sendWechatMessage(config.webhookUrl, testTitle, testContent);
          break;

        case 'email':
          if (!config.recipients || config.recipients.length === 0) {
            return { success: false, message: '缺少收件人地址' };
          }
          await this.sendEmail(config.recipients, testTitle, testContent);
          break;

        default:
          return { success: false, message: `不支持的推送类型: ${type}` };
      }

      return { success: true, message: '测试推送发送成功' };
    } catch (error) {
      return { success: false, message: `测试推送失败: ${error}` };
    }
  }
}

// 导出服务实例
export const notificationService = new NotificationService();