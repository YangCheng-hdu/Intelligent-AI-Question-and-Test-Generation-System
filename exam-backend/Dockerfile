# 使用OpenJDK 17作为基础镜像
FROM openjdk:17-jdk-slim

# 设置工作目录
WORKDIR /app

# 复制Maven包装器
COPY mvnw .
COPY .mvn .mvn

# 复制pom.xml
COPY pom.xml .

# 复制源代码
COPY src src

# 设置执行权限
RUN chmod +x mvnw

# 编译项目
RUN ./mvnw clean compile -DskipTests

# 打包项目
RUN ./mvnw package -DskipTests

# 暴露端口
EXPOSE 8080

# 运行应用
CMD ["java", "-jar", "target/exam-backend-0.0.1-SNAPSHOT.jar"] 