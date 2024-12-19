FROM nginx:stable-perl
# myconfig 생성
COPY ./myconfig1.conf /etc/nginx/conf.d/myconfig1.conf
# default.conf 삭제
RUN rm /etc/nginx/conf.d/default.conf


EXPOSE 80

CMD ["nginx","-g","daemon off;"]