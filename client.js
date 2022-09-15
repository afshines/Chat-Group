const grpc = require("grpc")
const PROTO_PATH = "./proto/auth.proto"
const AuthService = grpc.load(PROTO_PATH).AuthService
const client = new AuthService(
  "localhost:50051",
  grpc.credentials.createInsecure()
)
module.exports = client