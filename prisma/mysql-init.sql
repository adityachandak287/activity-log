-- Granting permissions to user required by prisma migrate command
-- refer https://www.prisma.io/docs/concepts/components/prisma-migrate/shadow-database#shadow-database-user-permissions

GRANT CREATE, ALTER, DROP, REFERENCES ON *.* to 'user'@'%';
