# Stage 1: Build the Frontend
FROM node:20 AS frontend-build
WORKDIR /frontend
COPY ["Frontend/package.json", "Frontend/package-lock.json*", "./"]
RUN npm install
COPY Frontend/ .
RUN npm run build

# Stage 2: Build the Backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Backend/PosCrono.API.csproj", "Backend/"]
RUN dotnet restore "Backend/PosCrono.API.csproj"
COPY Backend/ Backend/
WORKDIR /src/Backend
# Ensure wwwroot exists and copy frontend build output
RUN mkdir -p wwwroot
COPY --from=frontend-build /frontend/dist ./wwwroot/
RUN dotnet publish "PosCrono.API.csproj" -c Release -o /app/publish

# Stage 3: Final Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5006
EXPOSE 5006
ENTRYPOINT ["dotnet", "PosCrono.API.dll"]
