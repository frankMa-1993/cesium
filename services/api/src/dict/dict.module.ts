/**
 * 数据字典模块：字典类型、版本快照、发布与版本差异对比。
 */
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictTypeEntity } from '../entities/dict-type.entity'
import { DictSnapshotEntity } from '../entities/dict-snapshot.entity'
import { DictService } from './dict.service'
import { DictController } from './dict.controller'
import { AuthModule } from '../auth/auth.module'
import { PermissionsGuard } from '../common/guards/permissions.guard'

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([DictTypeEntity, DictSnapshotEntity]),
  ],
  providers: [DictService, PermissionsGuard],
  controllers: [DictController],
})
export class DictModule {}
