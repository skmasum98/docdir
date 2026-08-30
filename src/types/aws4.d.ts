declare module "aws4" {
  function sign(opts: any, credentials: { accessKeyId: string; secretAccessKey: string }): any;
  const aws4: { sign: typeof sign };
  export default aws4;
}
