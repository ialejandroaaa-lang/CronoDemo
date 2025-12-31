FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["PosCrono.API.csproj", "./"]
RUN dotnet restore "./PosCrono.API.csproj"
COPY . .
RUN dotnet publish "PosCrono.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5006
EXPOSE 5006
ENTRYPOINT ["dotnet", "PosCrono.API.dll"]
