import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or does not belong to organization',
  })
  async createTransaction(
    @Request() req,
    @Body() createTransactionDto: {
      amount: number;
      currency: string;
      description: string;
      notes?: string;
      type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
      date: Date;
      reference?: string;
      externalId?: string;
      isRecurring?: boolean;
      recurringPattern?: string;
      categoryId: string;
    },
  ) {
    return this.transactionsService.create(req.user.currentOrganizationId, {
      ...createTransactionDto,
      createdById: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'] })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'amountMin', required: false })
  @ApiQuery({ name: 'amountMax', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async getTransactions(
    @Request() req,
    @Query() paginationDto: PaginationDto,
    @Query() filters?: {
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
      categoryId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      amountMin?: number;
      amountMax?: number;
      search?: string;
    },
  ) {
    return this.transactionsService.findAll(
      req.user.currentOrganizationId,
      paginationDto,
      filters,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({
    status: 200,
    description: 'Transaction summary retrieved successfully',
  })
  async getTransactionSummary(
    @Request() req,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ) {
    return this.transactionsService.getTransactionSummary(
      req.user.currentOrganizationId,
      dateFrom,
      dateTo,
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getTransactionById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findOne(req.user.currentOrganizationId, id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async updateTransaction(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: {
      amount?: number;
      currency?: string;
      description?: string;
      notes?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
      date?: Date;
      reference?: string;
      externalId?: string;
      isRecurring?: boolean;
      recurringPattern?: string;
      categoryId?: string;
    },
  ) {
    return this.transactionsService.update(
      req.user.currentOrganizationId,
      id,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({
    status: 204,
    description: 'Transaction deleted successfully',
  })
  async deleteTransaction(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.delete(req.user.currentOrganizationId, id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple transactions' })
  @ApiResponse({
    status: 201,
    description: 'Transactions created successfully',
  })
  async createBulkTransactions(
    @Request() req,
    @Body() bulkTransactionsDto: {
      transactions: Array<{
        amount: number;
        currency: string;
        description: string;
        notes?: string;
        type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
        status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
        date: Date;
        reference?: string;
        externalId?: string;
        categoryId: string;
      }>;
    },
  ) {
    return this.transactionsService.bulkCreate(
      req.user.currentOrganizationId,
      bulkTransactionsDto.transactions.map(t => ({
        ...t,
        createdById: req.user.id,
      })),
    );
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import transactions from CSV' })
  @ApiResponse({
    status: 201,
    description: 'Transactions imported successfully',
  })
  async importTransactions(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate file
    this.fileUploadService.validateFile(file, ['text/csv', 'application/csv'], 5 * 1024 * 1024); // 5MB

    // Parse CSV and import transactions
    // This is a simplified implementation - you'd need a proper CSV parser
    const csvData = file.buffer.toString().split('\n').slice(1); // Skip header
    const transactions = csvData.map(row => {
      const [amount, currency, description, notes, type, status, date, reference, externalId, categoryId] = row.split(',');
      return {
        amount: parseFloat(amount) || 0,
        currency: currency || 'USD',
        description: description || '',
        notes,
        type: type?.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER' || 'EXPENSE',
        status: status?.toUpperCase() as 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' || 'COMPLETED',
        date: new Date(date) || new Date(),
        reference,
        externalId,
        categoryId: categoryId?.trim(),
      };
    });

    return this.transactionsService.importFromCSV(
      req.user.currentOrganizationId,
      transactions,
      req.user.id,
    );
  }

  @Post(':id/attachment')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiOperation({ summary: 'Upload transaction attachment' })
  @ApiResponse({
    status: 200,
    description: 'Attachment uploaded successfully',
  })
  async uploadAttachment(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate file
    this.fileUploadService.validateFile(file, ['image/jpeg', 'image/png', 'application/pdf'], 10 * 1024 * 1024); // 10MB

    // Upload to S3
    const fileKey = await this.fileUploadService.uploadFile(
      file,
      req.user.currentOrganizationId,
      'transactions',
    );

    // Update transaction with attachment
    return this.transactionsService.update(req.user.currentOrganizationId, id, {
      attachment: fileKey,
    });
  }
}