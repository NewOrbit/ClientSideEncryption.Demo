FROM "mcr.microsoft.com/dotnet/sdk:5.0.406"

COPY library-scripts/*.sh library-scripts/*.env /tmp/library-scripts/
RUN  bash /tmp/library-scripts/azcli-debian.sh \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/* /tmp/library-scripts
RUN dotnet dev-certs https