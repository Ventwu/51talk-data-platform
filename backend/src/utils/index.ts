import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload, User } from '../types';

/**
 * 密码加密工具
 */
export class PasswordUtils {
  /**
   * 加密密码
   */
  static async hash(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

/**
 * JWT令牌工具
 */
export class TokenUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * 生成访问令牌
   */
  static generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(payload, this.JWT_SECRET as string, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(payload, this.JWT_SECRET as string, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });
  }

  /**
   * 验证令牌
   */
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
  }

  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}

/**
 * 验证工具
 */
export class ValidationUtils {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   */
  static isValidPassword(password: string): boolean {
    // 至少8位，包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username: string): boolean {
    // 3-20位，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 验证JSON格式
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 响应工具
 */
export class ResponseUtils {
  /**
   * 成功响应
   */
  static success<T>(data?: T, message?: string) {
    return {
      success: true,
      data,
      message
    };
  }

  /**
   * 错误响应
   */
  static error(message: string, error?: string) {
    return {
      success: false,
      message,
      error
    };
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

/**
 * 日期工具
 */
export class DateUtils {
  /**
   * 格式化日期
   */
  static format(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取当前时间戳
   */
  static now(): number {
    return Date.now();
  }

  /**
   * 添加天数
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

/**
 * 字符串工具
 */
export class StringUtils {
  /**
   * 生成随机字符串
   */
  static random(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 首字母大写
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 驼峰转下划线
   */
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线转驼峰
   */
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

/**
 * 数据库查询构建工具
 */
export class QueryBuilder {
  /**
   * 构建分页查询
   */
  static buildPagination(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    return {
      limit,
      offset,
      page
    };
  }

  /**
   * 构建搜索条件
   */
  static buildSearchCondition(search: string, fields: string[]) {
    if (!search || !fields.length) {
      return { condition: '', params: [] };
    }

    const conditions = fields.map(field => `${field} LIKE ?`);
    const params = fields.map(() => `%${search}%`);

    return {
      condition: `(${conditions.join(' OR ')})`,
      params
    };
  }

  /**
   * 构建排序条件
   */
  static buildOrderBy(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'DESC') {
    if (!sortBy) {
      return 'ORDER BY created_at DESC';
    }
    return `ORDER BY ${sortBy} ${sortOrder}`;
  }
}

/**
 * 文件工具
 */
export class FileUtils {
  /**
   * 获取文件扩展名
   */
  static getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = StringUtils.random(6);
    const extension = this.getExtension(originalName);
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
  }

  /**
   * 验证文件类型
   */
  static isValidImageType(filename: string): boolean {
    const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = this.getExtension(filename);
    return validTypes.includes(extension);
  }
}

// 导出所有工具类