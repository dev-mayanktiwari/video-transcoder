FROM ubuntu:focal

RUN /usr/bin/apt-get update && \
    /usr/bin/apt-get install -y curl && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    source ~/.bashrc && \
    nvm install v20.12.1 && \
    /usr/bin/apt-get update && \
    /usr/bin/apt-get upgrade -y && \
    /usr/bin/apt-get install -y ffmpeg

WORKDIR /home/app/video-transcoding-project

