# Stage 1: Build the Frontend (React)
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY ["Frontend/package.json", "Frontend/package-lock.json*", "./"]
RUN npm install
COPY Frontend/ .
RUN npm run build

# Stage 2: Build the Backend (.NET 9)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Backend/PosCrono.API.csproj", "Backend/"]
RUN dotnet restore "Backend/PosCrono.API.csproj"
COPY Backend/ Backend/
WORKDIR /src/Backend
# Ensure static files directory and copy frontend assets
RUN mkdir -p wwwroot
COPY --from=frontend-build /app/dist ./wwwroot/
RUN dotnet publish "PosCrono.API.csproj" -c Release -o /app/publish

# Stage 3: Final Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
# Production environment variables
ENV ASPNETCORE_URLS=http://+:5006
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5006
ENTRYPOINT ["dotnet", "PosCrono.API.dll"]
