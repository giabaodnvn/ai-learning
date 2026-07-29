# frozen_string_literal: true

require "rails_helper"

RSpec.describe AiJson do
  subject(:parse) { described_class.method(:parse) }

  it "parses a bare JSON object" do
    expect(parse.call('{"a":1}')).to eq("a" => 1)
  end

  it "parses an object wrapped in a ```json fence" do
    expect(parse.call("```json\n{\"a\":1}\n```")).to eq("a" => 1)
  end

  it "parses an object buried in prose" do
    expect(parse.call('Đây là kết quả: {"a":1} — hết.')).to eq("a" => 1)
  end

  # GrammarSetPrompt asks for a top-level array. Scanning only for the
  # outermost { … } sliced that down to `{...},{...}`, which never parses, so
  # every unfenced set generation failed with a 503.
  it "parses a bare JSON array of objects" do
    raw = '[{"type":"fill_blank"},{"type":"choice"}]'

    expect(parse.call(raw)).to eq([ { "type" => "fill_blank" }, { "type" => "choice" } ])
  end

  it "parses an array wrapped in a fence" do
    expect(parse.call("```\n[{\"type\":\"choice\"}]\n```")).to eq([ { "type" => "choice" } ])
  end

  it "prefers the object when the response is an object containing an array" do
    expect(parse.call('{"sections":[{"q":1}]}')).to eq("sections" => [ { "q" => 1 } ])
  end

  it "raises a ServiceError on unparseable output" do
    expect { parse.call("xin lỗi, tôi không thể trả lời") }
      .to raise_error(ClaudeService::ServiceError, /unparseable JSON/)
  end
end
