import mongoose from "mongoose";

const redactMongoUri = (uri) => {
  try {
    const parsed = new URL(uri);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";

    return {
      scheme: parsed.protocol.replace(":", ""),
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, "") || "(not specified)",
      query: parsed.search ? "present" : "missing",
    };
  } catch {
    return null;
  }
};

const atlasFallbacks = {
  "cluster0.dc3h2qv.mongodb.net": {
    directHost: "ac-f6lfphb-shard-00-01.dc3h2qv.mongodb.net:27017",
  },
};

const isSrvLookupError = (error) => {
  const message = getErrorText(error);
  return message.includes("querysrv") || message.includes("enotfound");
};

const getErrorText = (error) => {
  const parts = [error?.code, error?.message, error?.name];

  if (error?.reason?.servers instanceof Map) {
    for (const server of error.reason.servers.values()) {
      parts.push(server?.error?.code, server?.error?.message, server?.error?.name);
    }
  }

  return parts.filter(Boolean).join(" ").toLowerCase();
};

const buildDirectAtlasUri = (uri) => {
  const parsed = new URL(uri);
  const fallback = atlasFallbacks[parsed.hostname];

  if (!fallback) {
    return null;
  }

  const params = new URLSearchParams(parsed.search);
  params.set("tls", "true");
  params.set("authSource", "admin");
  params.set("directConnection", "true");
  params.set("retryWrites", params.get("retryWrites") || "true");
  params.set("w", params.get("w") || "majority");

  return `mongodb://${parsed.username}:${parsed.password}@${fallback.directHost}${parsed.pathname}?${params.toString()}`;
};

const getConnectionUri = (uri) => {
  const directUri = buildDirectAtlasUri(uri);

  if (directUri) {
    return {
      uri: directUri,
      usingFallback: true,
    };
  }

  return {
    uri,
    usingFallback: false,
  };
};

const getMongoHint = (error) => {
  const message = getErrorText(error);

  if (message.includes("querysrv") || message.includes("enotfound")) {
    return "Atlas SRV DNS lookup failed. If Test-NetConnection to the shard host succeeds, add your current IP in Atlas Network Access and try another DNS/network if this continues.";
  }

  if (message.includes("eacces")) {
    return "Windows, antivirus, VPN, or firewall is blocking Node.js from opening an outbound connection to MongoDB on port 27017. Allow node.exe through the firewall or try a less restricted network.";
  }

  if (message.includes("not primary")) {
    return "The direct Atlas fallback reached a secondary node. Run the MongoDB hello check and update the fallback host to the current primary.";
  }

  if (
    message.includes("econnrefused") ||
    message.includes("etimeout") ||
    message.includes("server selection timed out") ||
    message.includes("could not connect to any servers")
  ) {
    return "Atlas is reachable by URI, but this machine/network cannot connect to MongoDB on port 27017. Check Atlas Network Access, firewall, VPN/proxy, or try a mobile hotspot.";
  }

  if (
    message.includes("authentication failed") ||
    message.includes("bad auth") ||
    message.includes("auth failed")
  ) {
    return "MongoDB authentication failed. Check the username/password in MONGO_URI and the user in Atlas Database Access.";
  }

  if (message.includes("ip") || message.includes("whitelist")) {
    return "MongoDB Atlas may be blocking this IP. Add your current IP in Atlas Network Access.";
  }

  return "MongoDB connection failed. Check MONGO_URI, Atlas Network Access, and local network access to port 27017.";
};

export const getMongoDiagnostics = () => {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    return {
      ok: false,
      message: "MONGO_URI is missing. Add it to backend/.env before starting the server or seeder.",
    };
  }

  const details = redactMongoUri(uri);

  if (!details) {
    return {
      ok: false,
      message: "MONGO_URI is not a valid MongoDB connection string.",
    };
  }

  if (!["mongodb", "mongodb+srv"].includes(details.scheme)) {
    return {
      ok: false,
      message: `MONGO_URI must start with mongodb:// or mongodb+srv://. Current scheme: ${details.scheme}`,
    };
  }

  return { ok: true, uri, details };
};

export const logMongoDiagnostics = (details, label = "MongoDB") => {
  console.log(`${label} connection target:`);
  console.log({
    scheme: details.scheme,
    host: details.host,
    database: details.database,
    query: details.query,
  });
};

export const connectDB = async ({ label = "MongoDB", logTarget = true } = {}) => {
  const diagnostics = getMongoDiagnostics();

  if (!diagnostics.ok) {
    throw new Error(diagnostics.message);
  }

  if (logTarget) {
    logMongoDiagnostics(diagnostics.details, label);
  }

  try {
    const connection = getConnectionUri(diagnostics.uri);

    if (connection.usingFallback) {
      console.log("Using direct Atlas single-host connection to bypass SRV/replica-set DNS discovery.");
    }

    await mongoose.connect(connection.uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`${label} connected`);
  } catch (error) {
    const fallbackUri = isSrvLookupError(error)
      ? buildDirectAtlasUri(diagnostics.uri)
      : null;

    if (fallbackUri) {
      console.log("SRV DNS lookup failed. Trying direct Atlas single-host fallback...");
      await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log(`${label} connected with direct Atlas single-host fallback`);
      return;
    }

    error.message = `${error.message}\nHint: ${getMongoHint(error)}`;
    throw error;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
