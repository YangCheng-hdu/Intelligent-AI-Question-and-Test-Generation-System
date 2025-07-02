# 智能试卷生成系统

一个基于Spring Boot和AI技术的智能试卷生成系统，支持多科目题目生成、题库管理、试卷编辑和PDF导出功能。

## ✨ 核心功能

### 🎯 AI智能题目生成
- **多科目支持**：数学、语文、英语、物理、化学、生物、历史、地理、政治
- **多题型支持**：选择题、填空题、简答题、计算题、论述题、判断题
- **智能生成**：基于智谱AI GLM-4-Plus模型，生成高质量题目
- **领域限制**：支持指定特定知识点范围生成题目
- **数学公式**：完整支持LaTeX数学公式渲染

### 📚 题库管理系统
- **题目保存**：将生成的优质题目保存到题库
- **分类筛选**：按科目、题型快速筛选题目
- **关键词搜索**：支持题目内容关键词搜索
- **批量操作**：支持批量删除和导出

### 📝 试卷编辑功能
- **灵活编辑**：支持直接编辑题目内容、答案、解析
- **AI修改**：通过自然语言描述让AI修改题目
- **题型分值**：支持为不同题型设置不同分值
- **实时预览**：所见即所得的试卷预览

### 📄 文档导出功能
- **PDF试卷**：生成标准格式的PDF试卷文档
- **答案解析**：生成包含答案和详细解析的文档
- **中文支持**：完美支持中文字体和数学公式
- **格式美观**：专业的排版和样式设计

## 🛠 技术架构

### 后端技术栈
- **Spring Boot 3.5.3** - 主应用框架
- **Spring Data JPA** - 数据持久化
- **PostgreSQL** - 生产数据库
- **H2 Database** - 开发测试数据库
- **Spring Security** - 安全框架
- **智谱AI API** - AI题目生成服务

### 前端技术栈
- **HTML5 + CSS3** - 现代Web标准
- **Bootstrap 5** - 响应式UI框架
- **JavaScript ES6+** - 交互逻辑
- **MathJax 3** - 数学公式渲染
- **jsPDF + html2canvas** - PDF生成
- **Font Awesome** - 图标库

### 核心特性
- **响应式设计** - 支持桌面和移动设备
- **实时保存** - 自动保存用户操作状态
- **会话管理** - 智能区分页面刷新和新会话
- **错误处理** - 完善的错误提示和恢复机制
- **高级UI** - 现代平面设计风格

## 🚀 快速开始

### 环境要求
- **Java 17+** - 运行环境
- **Maven 3.6+** - 构建工具
- **PostgreSQL 12+** - 生产数据库（可选）

### 一键启动
```bash
# Windows用户
.\start.bat

# 或使用PowerShell
.\start.ps1

# Linux/Mac用户
./mvnw spring-boot:run
```

### 访问系统
启动成功后访问：`http://localhost:8080`

## 📁 项目结构

```
src/main/java/com/example/exambackend/
├── config/                    # 配置类
│   ├── AIConfig.java         # AI服务配置
│   ├── SecurityConfig.java   # 安全配置
│   └── WebClientConfig.java  # HTTP客户端配置
├── controller/               # REST控制器
│   ├── QuestionController.java      # 题目管理API
│   ├── SubjectController.java       # 科目管理API
│   ├── QuestionTypeController.java  # 题型管理API
│   └── ExamPaperController.java     # 试卷生成API
├── dto/                     # 数据传输对象
│   ├── QuestionGenerationRequest.java  # 题目生成请求
│   ├── QuestionModificationRequest.java # 题目修改请求
│   ├── QuestionEditRequest.java        # 题目编辑请求
│   ├── QuestionTypeScore.java          # 题型分值配置
│   ├── ExamPaperGenerationRequest.java # 试卷生成请求
│   ├── ExamPaperResponse.java          # 试卷响应
│   └── ExamQuestion.java               # 试卷题目
├── entity/                  # JPA实体类
│   ├── Question.java        # 题目实体
│   ├── Subject.java         # 科目实体
│   └── QuestionType.java    # 题型实体
├── repository/              # 数据访问层
│   ├── QuestionRepository.java     # 题目数据访问
│   ├── SubjectRepository.java      # 科目数据访问
│   └── QuestionTypeRepository.java # 题型数据访问
├── service/                 # 业务逻辑层
│   ├── AIService.java       # AI服务接口
│   ├── QuestionService.java # 题目服务接口
│   ├── DataInitService.java # 数据初始化服务
│   └── impl/
│       ├── AIServiceImpl.java        # AI服务实现
│       └── QuestionServiceImpl.java  # 题目服务实现
└── ExamBackendApplication.java       # 主启动类

src/main/resources/
├── static/                  # 静态资源
│   ├── index.html          # 主页面
│   └── js/
│       └── app.js          # 前端逻辑
├── application.properties   # 主配置文件
└── application-postgres.properties # PostgreSQL配置
```

## 📋 主要API接口

### 题目管理
- `POST /api/questions/generate` - 生成题目
- `POST /api/questions/modify` - 修改题目
- `PUT /api/questions/{id}/edit` - 编辑题目
- `GET /api/questions/bank` - 获取题库题目
- `POST /api/questions/save-to-bank` - 保存到题库
- `DELETE /api/questions/bank/{id}` - 从题库删除

### 试卷管理
- `GET /api/questions/exam` - 获取试卷题目
- `POST /api/questions/add-to-exam` - 加入试卷
- `POST /api/exam-paper/generate` - 生成试卷PDF
- `GET /api/exam-paper/analyze-question-types` - 分析题型分布

### 基础数据
- `GET /api/subjects` - 获取科目列表
- `GET /api/question-types` - 获取题型列表

## 🔧 配置说明

### 数据库配置
```properties
# PostgreSQL生产环境
spring.profiles.active=postgres
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=your_password

# H2开发环境（默认）
spring.profiles.active=h2
spring.datasource.url=jdbc:h2:mem:testdb
```

### AI服务配置
```properties
# 智谱AI配置
ai.zhipu.api.key=your_api_key_here
ai.zhipu.api.url=https://open.bigmodel.cn/api/paas/v4/chat/completions
ai.zhipu.model=glm-4-plus
```

## 🎨 界面特色

- **现代平面设计** - 简洁高级的视觉风格
- **响应式布局** - 完美适配各种设备
- **实时预览** - 所见即所得的编辑体验
- **智能保存** - 自动保存用户操作状态
- **数学公式** - 完整的LaTeX公式支持

## 🔍 使用指南

1. **生成题目**：选择科目、题型、数量，可指定领域限制
2. **管理题目**：保存优质题目到题库，支持编辑和AI修改
3. **组建试卷**：从生成的题目或题库中选择题目加入试卷
4. **设置分值**：为不同题型设置不同的分值权重
5. **导出文档**：生成PDF格式的试卷和答案解析

## 🚀 部署方式

### 本地开发
```bash
git clone <repository-url>
cd exam-backend
./start.bat  # Windows
./start.ps1  # PowerShell
```

### Docker部署
```bash
docker-compose up -d
```

### 生产部署
1. 配置PostgreSQL数据库
2. 设置环境变量
3. 构建JAR包：`mvn clean package`
4. 运行：`java -jar target/exam-backend-0.0.1-SNAPSHOT.jar`

## 📞 技术支持

- **问题反馈**：通过GitHub Issues提交
- **功能建议**：欢迎提交Pull Request
- **技术交流**：项目讨论区

---

**智能试卷生成系统** - 让教育更智能，让出题更简单！